-- ReWear five-tier RBAC migration for Supabase PostgreSQL.
-- Apply after supabase/schema.sql.

do $$
begin
  create type public.app_role as enum ('user', 'trusted_user', 'moderator', 'lead_moderator', 'admin');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.account_status as enum ('active', 'warned', 'banned');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.report_status as enum ('open', 'in_review', 'resolved', 'dismissed', 'escalated');
exception
  when duplicate_object then null;
end;
$$;

alter table public.profiles
  add column if not exists role public.app_role not null default 'user',
  add column if not exists account_status public.account_status not null default 'active',
  add column if not exists warning_count integer not null default 0 check (warning_count >= 0),
  add column if not exists featured_badge boolean not null default false;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete cascade,
  reason text not null check (char_length(trim(reason)) between 5 and 1000),
  details text check (char_length(details) <= 3000),
  status public.report_status not null default 'open',
  assigned_to uuid references public.profiles(id) on delete set null,
  resolution_note text check (char_length(resolution_note) <= 2000),
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint reports_target_check check (
    (product_id is not null and reported_user_id is null)
    or (product_id is null and reported_user_id is not null)
  )
);

create table if not exists public.moderation_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id) on delete restrict,
  target_user_id uuid references public.profiles(id) on delete set null,
  target_product_id uuid references public.products(id) on delete set null,
  report_id uuid references public.reports(id) on delete set null,
  action text not null check (action in ('delete_listing', 'restore_listing', 'warn_user', 'ban_user', 'unban_user', 'resolve_report', 'dismiss_report', 'assign_role')),
  reason text not null check (char_length(trim(reason)) between 3 and 2000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint moderation_logs_target_check check (
    target_user_id is not null or target_product_id is not null or report_id is not null
  )
);

create table if not exists public.platform_settings (
  setting_key text primary key check (setting_key ~ '^[a-z][a-z0-9_]{2,80}$'),
  setting_value jsonb not null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists reports_status_created_at_idx on public.reports (status, created_at asc);
create index if not exists reports_assigned_to_status_idx on public.reports (assigned_to, status);
create index if not exists moderation_logs_actor_created_at_idx on public.moderation_logs (actor_id, created_at desc);
create index if not exists moderation_logs_target_user_created_at_idx on public.moderation_logs (target_user_id, created_at desc);
create index if not exists moderation_logs_target_product_created_at_idx on public.moderation_logs (target_product_id, created_at desc);

create or replace function public.role_rank(candidate_role public.app_role)
returns smallint
language sql
immutable
parallel safe
as $$
  select case candidate_role
    when 'user' then 1
    when 'trusted_user' then 2
    when 'moderator' then 3
    when 'lead_moderator' then 4
    when 'admin' then 5
  end;
$$;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_account_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select account_status <> 'banned' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.has_minimum_role(minimum_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.role_rank(public.current_app_role()) >= public.role_rank(minimum_role), false);
$$;

create or replace function public.can_manage_target(target_user uuid, minimum_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    auth.uid() <> target_user
    and public.role_rank(public.current_app_role()) >= public.role_rank(minimum_role)
    and public.role_rank(public.current_app_role()) > public.role_rank((select role from public.profiles where id = target_user)),
    false
  );
$$;

create or replace function public.can_perform_moderation_action(target_user uuid, requested_action text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  actor_role public.app_role;
  target_role public.app_role;
begin
  select role into actor_role from public.profiles where id = auth.uid();
  select role into target_role from public.profiles where id = target_user;

  if actor_role is null or target_role is null or auth.uid() = target_user then
    return false;
  end if;

  if public.role_rank(actor_role) <= public.role_rank(target_role) then
    return false;
  end if;

  case requested_action
    when 'delete_listing', 'restore_listing' then
      return public.role_rank(actor_role) >= public.role_rank('moderator');
    when 'warn_user', 'ban_user', 'unban_user' then
      return public.role_rank(actor_role) >= public.role_rank('lead_moderator');
    else
      return false;
  end case;
end;
$$;

create or replace function public.prevent_unauthorized_profile_privilege_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.role() = 'authenticated'
    and auth.uid() = old.id
    and (new.role <> old.role or new.account_status <> old.account_status or new.warning_count <> old.warning_count or new.featured_badge <> old.featured_badge) then
    raise exception 'Profile privilege fields can only be changed by authorized management actions.';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_unauthorized_privilege_change
before update on public.profiles
for each row execute function public.prevent_unauthorized_profile_privilege_change();

create trigger reports_set_updated_at before update on public.reports
for each row execute function public.set_updated_at();
create trigger platform_settings_set_updated_at before update on public.platform_settings
for each row execute function public.set_updated_at();

alter table public.reports enable row level security;
alter table public.moderation_logs enable row level security;
alter table public.platform_settings enable row level security;

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update non-privileged profile fields"
on public.profiles for update to authenticated
using (id = auth.uid() and public.current_account_is_active())
with check (id = auth.uid());

drop policy if exists "Authenticated users can create their own products" on public.products;
drop policy if exists "Sellers can update their own products" on public.products;
drop policy if exists "Sellers can delete their own products" on public.products;
create policy "Active users can create their own products"
on public.products for insert to authenticated
with check (seller_id = auth.uid() and public.current_account_is_active());
create policy "Active sellers can update their own products"
on public.products for update to authenticated
using (seller_id = auth.uid() and public.current_account_is_active())
with check (seller_id = auth.uid() and public.current_account_is_active());
create policy "Active sellers can delete their own products"
on public.products for delete to authenticated
using (seller_id = auth.uid() and public.current_account_is_active());

drop policy if exists "Users can send messages as themselves" on public.messages;
create policy "Active users can send messages as themselves"
on public.messages for insert to authenticated
with check (sender_id = auth.uid() and recipient_id <> auth.uid() and public.current_account_is_active());

create policy "Reporters and management can view reports"
on public.reports for select to authenticated
using (reporter_id = auth.uid() or public.has_minimum_role('moderator'));
create policy "Active users can create reports"
on public.reports for insert to authenticated
with check (
  reporter_id = auth.uid()
  and public.current_account_is_active()
  and (product_id is null or exists (select 1 from public.products where products.id = product_id and products.seller_id <> auth.uid()))
  and (reported_user_id is null or reported_user_id <> auth.uid())
);
create policy "Moderators can update reports"
on public.reports for update to authenticated
using (public.has_minimum_role('moderator'))
with check (public.has_minimum_role('moderator'));

create policy "Lead moderators and admins can view moderation logs"
on public.moderation_logs for select to authenticated
using (public.has_minimum_role('lead_moderator'));

create policy "Admins can view platform settings"
on public.platform_settings for select to authenticated
using (public.has_minimum_role('admin'));
create policy "Admins can update platform settings"
on public.platform_settings for update to authenticated
using (public.has_minimum_role('admin'))
with check (public.has_minimum_role('admin'));
create policy "Admins can create platform settings"
on public.platform_settings for insert to authenticated
with check (public.has_minimum_role('admin'));
create policy "Admins can delete platform settings"
on public.platform_settings for delete to authenticated
using (public.has_minimum_role('admin'));

insert into public.platform_settings (setting_key, setting_value)
values
  ('listing_limits', '{"user": 30, "trusted_user": 100}'::jsonb),
  ('moderation', '{"auto_archive_after_reports": 3, "appeals_enabled": true}'::jsonb)
on conflict (setting_key) do nothing;
