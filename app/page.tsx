import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Camera,
  Heart,
  MessageCircle,
  PackageCheck,
  Shirt,
  Sparkles
} from 'lucide-react';

import { ProductGrid } from '@/components/ProductGrid';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';
import type { ProductWithSeller } from '@/types/database';

interface HomePageProps {
  searchParams: { category?: string; q?: string };
}

interface HeroFallback {
  color: string;
  label: string;
  price: string;
}

const heroFallbacks: HeroFallback[] = [
  { color: 'from-[#fa735e] via-[#ffb58d] to-[#ffe2bf]', label: 'Denim, nuova storia', price: 'da € 24' },
  { color: 'from-[#7866d8] via-[#b5a9ff] to-[#f2d7ff]', label: 'Un pezzo che resta', price: 'da € 18' },
  { color: 'from-[#35a68f] via-[#9be0bc] to-[#ecffd4]', label: 'Il tuo prossimo preferito', price: 'da € 22' }
];

const categoryStyles = [
  'bg-[#f9c845] text-[#191a37]',
  'bg-[#b9a8ff] text-[#191a37]',
  'bg-[#f4977a] text-[#191a37]',
  'bg-[#9bd9b4] text-[#191a37]',
  'bg-[#f6d9ea] text-[#191a37]',
  'bg-[#c8e3ff] text-[#191a37]'
];

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = createClient();
  const query = searchParams.q?.trim() ?? '';
  const selectedCategorySlug = searchParams.category?.trim() ?? '';

  const { data: categoryData } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });
  const categories = categoryData ?? [];
  const selectedCategory = categories.find((category) => category.slug === selectedCategorySlug);

  let productsQuery = supabase
    .from('products')
    .select('*, seller:profiles(id, username, full_name, avatar_url, rating), category:categories(id, name, slug)')
    .eq('status', 'active')
    .order('published_at', { ascending: false })
    .limit(30);

  if (query) {
    productsQuery = productsQuery.ilike('title', `%${query.replace(/[%_]/g, '\\$&')}%`);
  }

  if (selectedCategory) {
    productsQuery = productsQuery.eq('category_id', selectedCategory.id);
  }

  const { data: productData } = await productsQuery;
  const products = (productData ?? []) as unknown as ProductWithSeller[];
  const showLandingContent = !query && !selectedCategorySlug;

  return (
    <div className="overflow-hidden">
      {showLandingContent && <WearwareHero products={products.slice(0, 3)} />}

      <div className="container py-10 sm:py-16">
        {showLandingContent && categories.length > 0 && (
          <section className="mb-16" aria-labelledby="browse-categories-title">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Sfoglia al tuo ritmo</p>
                <h2 id="browse-categories-title" className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Trova il tuo prossimo giro.</h2>
              </div>
              <Link href="#articoli" className="inline-flex items-center gap-1 text-sm font-bold text-foreground hover:text-primary">
                Vedi tutti <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/?category=${encodeURIComponent(category.slug)}#articoli`}
                  className={`group flex min-h-28 items-end justify-between rounded-3xl p-5 transition duration-200 hover:-translate-y-1 hover:shadow-xl ${categoryStyles[index % categoryStyles.length]}`}
                >
                  <span className="text-xl font-black tracking-tight">{category.name}</span>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white/70 transition-transform group-hover:rotate-45"><ArrowUpRight className="h-5 w-5" aria-hidden="true" /></span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div id="articoli" className="scroll-mt-24">
          <ProductGrid
            products={products}
            title={query ? `Risultati per “${query}”` : selectedCategory ? selectedCategory.name : 'Nuovi arrivi'}
            emptyMessage={selectedCategory ? `Non ci sono ancora articoli in ${selectedCategory.name}. Torna presto o pubblica il primo.` : undefined}
          />
        </div>
      </div>

      {showLandingContent && <HowWearwareWorks />}
    </div>
  );
}

function WearwareHero({ products }: { products: ProductWithSeller[] }) {
  return (
    <section className="relative isolate overflow-hidden bg-[#191a37] text-white">
      <div className="absolute inset-0 opacity-30" aria-hidden="true">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-[#ff775c] blur-3xl" />
        <div className="absolute right-[-10rem] top-[-7rem] h-96 w-96 rounded-full bg-[#a897ff] blur-3xl" />
        <div className="absolute bottom-[-12rem] left-1/3 h-80 w-80 rounded-full bg-[#8ce0b0] blur-3xl" />
      </div>
      <div className="container relative grid gap-10 py-14 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16 lg:py-24">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white/90">
            <Sparkles className="h-3.5 w-3.5 text-[#f9c845]" aria-hidden="true" /> Wear it forward
          </p>
          <h1 className="mt-6 text-balance text-5xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Lo stile non finisce.<br />Fa il giro giusto.
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-white/75 sm:text-xl">
            Compra capi pre-loved, vendi quelli che non indossi più e fai spazio a nuove storie nel tuo armadio.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button size="lg" className="bg-[#f9c845] text-[#191a37] hover:bg-[#ffdb68]" asChild>
              <Link href="#articoli" className="gap-2">Scopri i drop <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/25 bg-white/5 text-white hover:border-white hover:bg-white hover:text-[#191a37]" asChild>
              <Link href="/sell">Metti in circolo</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/70">
            <span className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-[#8ce0b0]" aria-hidden="true" />Annunci, chat e ordini in un solo posto</span>
            <span className="flex items-center gap-2"><Heart className="h-4 w-4 text-[#ff9b9b]" aria-hidden="true" />Dai valore a ciò che hai già</span>
          </div>
        </div>

        <div className="relative mx-auto min-h-[390px] w-full max-w-[590px] sm:min-h-[450px]" aria-label="Anteprima degli articoli Wearware">
          <div className="absolute left-[7%] top-[12%] h-[72%] w-[56%] rotate-[-7deg] rounded-[2rem] border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-sm sm:left-[10%]">
            <HeroListing product={products[0]} fallback={heroFallbacks[0]} priority className="h-full" />
          </div>
          <div className="absolute right-[2%] top-[4%] h-[53%] w-[42%] rotate-[8deg] rounded-[1.75rem] border border-white/20 bg-white/10 p-2.5 shadow-xl backdrop-blur-sm">
            <HeroListing product={products[1]} fallback={heroFallbacks[1]} className="h-full" />
          </div>
          <div className="absolute bottom-[3%] right-[4%] h-[46%] w-[43%] rotate-[4deg] rounded-[1.75rem] border border-white/20 bg-white/10 p-2.5 shadow-xl backdrop-blur-sm">
            <HeroListing product={products[2]} fallback={heroFallbacks[2]} className="h-full" />
          </div>
          <div className="absolute bottom-[1%] left-[1%] max-w-56 rounded-2xl border border-white/15 bg-[#282952]/95 px-4 py-3 shadow-xl backdrop-blur">
            <p className="flex items-center gap-2 text-xs font-bold text-[#f9c845]"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" />Un nuovo giro, ogni giorno</p>
            <p className="mt-1 text-sm font-semibold leading-5 text-white">Il tuo prossimo capo preferito è già qui.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroListing({ className, fallback, priority = false, product }: { className?: string; fallback: HeroFallback; priority?: boolean; product?: ProductWithSeller }) {
  const imageUrl = product?.image_urls[0];
  const title = product?.title ?? fallback.label;
  const price = product ? formatPrice(product.price_cents, product.currency) : fallback.price;

  return (
    <article className={`relative overflow-hidden rounded-[1.35rem] bg-[#f8f2eb] text-[#191a37] ${className ?? ''}`}>
      <div className={`relative h-[76%] overflow-hidden ${imageUrl ? 'bg-[#e9e2dc]' : `bg-gradient-to-br ${fallback.color}`}`}>
        {imageUrl ? <Image src={imageUrl} alt={title} fill priority={priority} sizes="(max-width: 640px) 45vw, 280px" className="object-cover" /> : <Shirt className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 text-white/80" aria-hidden="true" />}
        <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] backdrop-blur">Pre-loved</span>
        <Heart className="absolute right-3 top-3 h-4 w-4 text-[#191a37]" aria-hidden="true" />
      </div>
      <div className="flex min-h-[24%] items-center justify-between gap-2 px-3 py-2.5">
        <p className="line-clamp-2 text-xs font-black leading-4">{title}</p>
        <span className="shrink-0 text-xs font-black">{price}</span>
      </div>
    </article>
  );
}

function HowWearwareWorks() {
  const steps = [
    { icon: Camera, number: '01', title: 'Carica ciò che non indossi', text: 'Foto, dettagli e prezzo: il tuo annuncio prende forma in pochi minuti.' },
    { icon: MessageCircle, number: '02', title: 'Trova la persona giusta', text: 'Chatta con la community, salva i preferiti e scegli con calma.' },
    { icon: PackageCheck, number: '03', title: 'Fai continuare la storia', text: 'Concludi l’ordine, spedisci il capo e lascia spazio al prossimo giro.' }
  ];

  return (
    <section className="border-y border-[#191a37]/10 bg-[#f9c845] py-16 sm:py-24">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#191a37]/70">Fatto per circolare</p>
            <h2 className="mt-3 max-w-lg text-balance text-4xl font-black tracking-[-0.045em] text-[#191a37] sm:text-5xl">Vendi bene. Scopri meglio.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[#191a37]/75">Wearware rende più semplice dare valore a quello che già esiste, senza perdere il piacere di trovare qualcosa di speciale.</p>
            <Button variant="outline" size="lg" className="mt-7 border-[#191a37] bg-transparent text-[#191a37] hover:bg-[#191a37] hover:text-white" asChild>
              <Link href="/how-it-works">Come funziona</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {steps.map((step) => (
              <article key={step.number} className="rounded-3xl bg-[#fffaf2] p-6 text-[#191a37] shadow-[0_12px_0_rgba(25,26,55,0.12)]">
                <div className="flex items-center justify-between"><step.icon className="h-6 w-6" aria-hidden="true" /><span className="text-sm font-black text-[#191a37]/45">{step.number}</span></div>
                <h3 className="mt-10 text-lg font-black leading-6">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#191a37]/70">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
