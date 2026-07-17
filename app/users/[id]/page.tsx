import { ProductGrid } from '@/components/ProductGrid';
import { createClient } from '@/lib/supabase/server';
import type { ProductWithSeller, Profile } from '@/types/database';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function UserPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: profileData }, { data: productData }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', params.id).maybeSingle(),
    supabase.from('products').select('*, seller:profiles(id, username, full_name, avatar_url, rating), category:categories(id, name, slug)').eq('seller_id', params.id).eq('status', 'active').order('published_at', { ascending: false })
  ]);
  if (!profileData) notFound();
  const profile = profileData as Profile;
  const products = (productData ?? []) as unknown as ProductWithSeller[];
  return <div className="container py-10 sm:py-14"><section className="rounded-2xl border border-border bg-card p-6 shadow-sm"><p className="text-sm font-semibold text-primary">Profilo venditore</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">{profile.full_name ?? `@${profile.username}`}</h1><p className="mt-2 text-sm text-muted-foreground">@{profile.username} · {Number(profile.rating).toFixed(1)} / 5 · {profile.review_count} recensioni</p>{profile.location && <p className="mt-2 text-sm text-muted-foreground">{profile.location}</p>}{profile.bio && <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{profile.bio}</p>}</section><div className="mt-10"><ProductGrid products={products} title="Articoli in vendita" emptyMessage="Questo utente non ha articoli disponibili al momento." /></div></div>;
}
