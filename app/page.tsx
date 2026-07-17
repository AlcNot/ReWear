import Link from 'next/link';
import { ArrowRight, BadgeCheck, CircleDollarSign, Leaf, ShieldCheck } from 'lucide-react';

import { ProductGrid } from '@/components/ProductGrid';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import type { ProductWithSeller } from '@/types/database';

interface HomePageProps {
  searchParams: { q?: string };
}

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = createClient();
  const query = searchParams.q?.trim() ?? '';
  let productsQuery = supabase
    .from('products')
    .select('*, seller:profiles(id, username, full_name, avatar_url, rating), category:categories(id, name, slug)')
    .eq('status', 'active')
    .order('published_at', { ascending: false })
    .limit(30);

  if (query) {
    productsQuery = productsQuery.ilike('title', `%${query.replace(/[%_]/g, '\\$&')}%`);
  }

  const [{ data: productData }, { data: categories }] = await Promise.all([
    productsQuery,
    supabase.from('categories').select('*').order('sort_order', { ascending: true })
  ]);
  const products = (productData ?? []) as unknown as ProductWithSeller[];

  return (
    <div>
      {!query && (
        <section className="border-b border-border bg-gradient-to-br from-emerald-50 via-background to-amber-50">
          <div className="container grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24">
            <div className="max-w-2xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary"><Leaf className="h-4 w-4" aria-hidden="true" />Moda circolare, fatta bene</p>
              <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">Dai ai capi una nuova storia.</h1>
              <p className="mt-5 max-w-xl text-balance text-lg leading-8 text-muted-foreground">Scopri pezzi unici pre-loved, libera il tuo armadio e rendi la moda più gentile con il pianeta.</p>
              <div className="mt-8 flex flex-wrap gap-3"><Button size="lg" asChild><Link href="#articoli" className="gap-2">Esplora articoli <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Button><Button variant="outline" size="lg" asChild><Link href="/sell">Inizia a vendere</Link></Button></div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <FeatureCard icon={<BadgeCheck className="h-6 w-6" />} title="Pezzi selezionati" text="Trova capi pronti a essere amati ancora." />
              <FeatureCard icon={<ShieldCheck className="h-6 w-6" />} title="Pagamenti protetti" text="Checkout sicuro e tracciabile con Stripe." />
              <FeatureCard icon={<CircleDollarSign className="h-6 w-6" />} title="Vendi senza complicazioni" text="Pubblica un annuncio in pochi minuti." />
              <FeatureCard icon={<Leaf className="h-6 w-6" />} title="Meno sprechi" text="Una scelta concreta per il tuo stile e il pianeta." />
            </div>
          </div>
        </section>
      )}

      <div className="container py-10 sm:py-14">
        {!query && categories && categories.length > 0 && <section className="mb-12"><div className="mb-4 flex items-end justify-between"><div><h2 className="text-2xl font-bold tracking-tight">Sfoglia per categoria</h2><p className="mt-1 text-sm text-muted-foreground">Trova subito quello che cerchi.</p></div></div><div className="flex gap-2 overflow-x-auto pb-1">{categories.map((category) => <Link key={category.id} href={`/?category=${category.slug}`} className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:border-primary hover:bg-primary hover:text-primary-foreground">{category.name}</Link>)}</div></section>}
        <div id="articoli"><ProductGrid products={products} title={query ? `Risultati per “${query}”` : 'Gli ultimi arrivi'} /></div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm"><span className="mb-4 inline-flex rounded-xl bg-primary/10 p-2.5 text-primary">{icon}</span><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div>;
}
