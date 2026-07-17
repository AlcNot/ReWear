-- ReWear database schema for Supabase PostgreSQL.
-- Run this file in the Supabase SQL Editor or with `supabase db push`.

create extension if not exists pgcrypto;

create type public.product_condition as enum (
  'new_with_tags',
  'new_without_tags',
  'very_good',
  'good',
  'satisfactory'
);

create type public.product_status as enum ('draft', 'active', 'reserved', 'sold', 'archived');
create type public.order_status as enum ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  full_name text,
  avatar_url text,
  bio text check (char_length(bio) <= 500),
  location text check (char_length(location) <= 120),
  rating numeric(3,2) not null default 0 check (rating >= 0 and rating <= 5),
  review_count integer not null default 0 check (review_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 50),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 10 and 5000),
  price_cents integer not null check (price_cents > 0 and price_cents <= 100000000),
  currency char(3) not null default 'EUR' check (currency = upper(currency)),
  size text not null check (char_length(size) between 1 and 32),
  brand text check (char_length(brand) <= 80),
  color text check (char_length(color) <= 50),
  condition public.product_condition not null,
  shipping_options text[] not null default array['standard']::text[]
    check (cardinality(shipping_options) > 0),
  image_urls text[] not null check (cardinality(image_urls) between 1 and 8),
  status public.product_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint product_published_at_consistency check (
    (status = 'active' and published_at is not null) or status <> 'active'
  )
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  seller_id uuid not null references public.profiles(id) on delete restrict,
  amount_cents integer not null check (amount_cents > 0),
  currency char(3) not null default 'EUR' check (currency = upper(currency)),
  status public.order_status not null default 'pending',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  shipping_address jsonb,
  tracking_number text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint buyer_is_not_seller check (buyer_id <> seller_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint message_sender_is_not_recipient check (sender_id <> recipient_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewed_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint reviewer_is_not_reviewed check (reviewer_id <> reviewed_id)
);

create index products_active_published_at_idx on public.products (published_at desc) where status = 'active';
create index products_seller_id_idx on public.products (seller_id);
create index products_category_id_idx on public.products (category_id);
create index orders_buyer_id_idx on public.orders (buyer_id);
create index orders_seller_id_idx on public.orders (seller_id);
create unique index orders_one_open_order_per_product_idx
on public.orders (product_id)
where status in ('pending', 'paid', 'shipped', 'delivered');
create index messages_participants_idx on public.messages (sender_id, recipient_id, created_at desc);
create index messages_recipient_unread_idx on public.messages (recipient_id, read_at) where read_at is null;
create index reviews_reviewed_id_idx on public.reviews (reviewed_id);
create unique index reviews_one_per_reviewer_and_order_idx on public.reviews (order_id, reviewer_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_username text;
begin
  generated_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    '[^a-z0-9_]',
    '',
    'g'
  ));

  if char_length(generated_username) < 3 then
    generated_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 12);
  end if;

  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    left(generated_username, 20) || '_' || substr(replace(new.id::text, '-', ''), 1, 3),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

create or replace function public.update_profile_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_profile uuid;
begin
  affected_profile := coalesce(new.reviewed_id, old.reviewed_id);

  update public.profiles
  set
    rating = coalesce((select round(avg(rating)::numeric, 2) from public.reviews where reviewed_id = affected_profile), 0),
    review_count = (select count(*) from public.reviews where reviewed_id = affected_profile)
  where id = affected_profile;

  return coalesce(new, old);
end;
$$;

create or replace function public.only_recipient_can_mark_message_read()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.sender_id <> old.sender_id
    or new.recipient_id <> old.recipient_id
    or new.product_id is distinct from old.product_id
    or new.body <> old.body
    or new.created_at <> old.created_at then
    raise exception 'Messages cannot be edited.';
  end if;
  return new;
end;
$$;

create or replace function public.keep_review_relationship_immutable()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.order_id <> old.order_id
    or new.reviewer_id <> old.reviewer_id
    or new.reviewed_id <> old.reviewed_id
    or new.created_at <> old.created_at then
    raise exception 'A review cannot be moved to another order or user.';
  end if;
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();
create trigger messages_set_updated_at before update on public.messages
for each row execute function public.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews
for each row execute function public.set_updated_at();
create trigger messages_only_allow_read_receipt_update before update on public.messages
for each row execute function public.only_recipient_can_mark_message_read();
create trigger reviews_keep_relationship_immutable before update on public.reviews
for each row execute function public.keep_review_relationship_immutable();
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
create trigger reviews_refresh_profile_rating
after insert or update or delete on public.reviews
for each row execute function public.update_profile_rating();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

-- Profiles are public storefront information. A user can only change their own profile.
create policy "Public profiles are viewable by everyone"
on public.profiles for select using (true);
create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

-- Categories are maintained by trusted server-side tooling (service role), never by browsers.
create policy "Categories are viewable by everyone"
on public.categories for select using (true);

-- Active listings are public; sellers can also access their own unpublished listings.
create policy "Active products and own products are viewable"
on public.products for select
using (
  status = 'active'
  or seller_id = auth.uid()
  or exists (
    select 1 from public.orders
    where orders.product_id = products.id
      and (orders.buyer_id = auth.uid() or orders.seller_id = auth.uid())
  )
);
create policy "Authenticated users can create their own products"
on public.products for insert to authenticated
with check (seller_id = auth.uid());
create policy "Sellers can update their own products"
on public.products for update to authenticated
using (seller_id = auth.uid()) with check (seller_id = auth.uid());
create policy "Sellers can delete their own products"
on public.products for delete to authenticated
using (seller_id = auth.uid());

-- An order is visible only to its buyer and seller.
create policy "Order participants can view their orders"
on public.orders for select to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid());
create policy "Buyers can create an order for an active listing"
on public.orders for insert to authenticated
with check (
  buyer_id = auth.uid()
  and exists (
    select 1 from public.products
    where products.id = product_id
      and products.seller_id = seller_id
      and products.status = 'active'
      and products.seller_id <> auth.uid()
      and products.price_cents = amount_cents
      and products.currency = currency
  )
);
-- Only trusted server code using the service-role client changes order status or Stripe fields.

-- Messages are private to the two participants.
create policy "Message participants can view messages"
on public.messages for select to authenticated
using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy "Users can send messages as themselves"
on public.messages for insert to authenticated
with check (sender_id = auth.uid() and recipient_id <> auth.uid());
create policy "Recipients can mark their messages read"
on public.messages for update to authenticated
using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy "Senders can delete their own messages"
on public.messages for delete to authenticated
using (sender_id = auth.uid());

-- Reviews are public and must be tied to an order involving both users.
create policy "Reviews are viewable by everyone"
on public.reviews for select using (true);
create policy "Order participants can leave one review"
on public.reviews for insert to authenticated
with check (
  reviewer_id = auth.uid()
  and exists (
    select 1 from public.orders
    where orders.id = order_id
      and orders.status = 'delivered'
      and ((orders.buyer_id = reviewer_id and orders.seller_id = reviewed_id)
        or (orders.seller_id = reviewer_id and orders.buyer_id = reviewed_id))
  )
);
create policy "Reviewers can update their own reviews"
on public.reviews for update to authenticated
using (reviewer_id = auth.uid()) with check (reviewer_id = auth.uid());
create policy "Reviewers can delete their own reviews"
on public.reviews for delete to authenticated
using (reviewer_id = auth.uid());

-- Product image uploads use a public bucket. Users can only write beneath their own user-id prefix.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Product images are publicly readable"
on storage.objects for select
using (bucket_id = 'product-images');
create policy "Users can upload their product images"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can update their product images"
on storage.objects for update to authenticated
using (bucket_id = 'product-images' and owner_id = auth.uid())
with check (bucket_id = 'product-images' and owner_id = auth.uid());
create policy "Users can delete their product images"
on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and owner_id = auth.uid());

insert into public.categories (name, slug, description, sort_order) values
  ('Donna', 'donna', 'Abbigliamento e accessori donna', 1),
  ('Uomo', 'uomo', 'Abbigliamento e accessori uomo', 2),
  ('Bambini', 'bambini', 'Moda per bambini e neonati', 3),
  ('Scarpe', 'scarpe', 'Scarpe, sneakers e stivali', 4),
  ('Accessori', 'accessori', 'Borse, gioielli e accessori', 5)
on conflict (slug) do nothing;
