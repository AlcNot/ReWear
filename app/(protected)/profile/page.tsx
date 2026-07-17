import { ProductGrid } from '@/components/ProductGrid';
import { createClient } from '@/lib/supabase/server';
import type { ProductWithSeller, Profile } from '@/types/database';

export const metadata = { title: 'Il mio profilo' };
export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ data: profileData }, { data: productData }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('products').select('*, seller:profiles(id, username, full_name, avatar_url, rating), category:categories(id, name, slug)').eq('seller_id', user.id).order('created_at', { ascending: false })
  ]);
  const profile = profileData as Profile | null;
  const products = (productData ?? []) as unknown as ProductWithSeller[];
  return <div className="container py-10 sm:py-14"><section className="rounded-2xl border border-border bg-card p-6 shadow-sm"><p className="text-sm font-semibold text-primary">Il tuo armadio</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">{profile?.full_name ?? `@${profile?.username ?? 'profilo'}`}</h1><div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground"><span>@{profile?.username}</span>{profile?.location && <span>{profile.location}</span>}<span>{Number(profile?.rating ?? 0).toFixed(1)} / 5 · {profile?.review_count ?? 0} recensioni</span></div>{profile?.bio && <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{profile.bio}</p>}</section><div className="mt-10"><ProductGrid products={products} title="I tuoi annunci" emptyMessage="Non hai ancora pubblicato articoli. Inizia a vendere il primo capo del tuo armadio." /></div></div>;
}
