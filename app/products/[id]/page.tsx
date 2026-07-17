import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, BadgeCheck, Heart, MapPin, MessageCircle, ShieldCheck, Star, Truck } from 'lucide-react';
import { notFound } from 'next/navigation';

import { BuyProductButton } from '@/components/BuyProductButton';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';
import type { ProductWithSeller } from '@/types/database';

const conditionLabels = {
  new_with_tags: 'Nuovo con cartellino',
  new_without_tags: 'Nuovo senza cartellino',
  very_good: 'Ottime condizioni',
  good: 'Buone condizioni',
  satisfactory: 'Condizioni soddisfacenti'
} as const;

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: productData }, { data: { user } }] = await Promise.all([
    supabase.from('products').select('*, seller:profiles(id, username, full_name, avatar_url, bio, location, rating, review_count), category:categories(id, name, slug)').eq('id', params.id).maybeSingle(),
    supabase.auth.getUser()
  ]);
  if (!productData) notFound();
  const product = productData as unknown as ProductWithSeller;
  const isOwnProduct = user?.id === product.seller_id;

  const isDemoMode = process.env.PAYMENT_PROVIDER !== 'stripe';

  return <div className="container py-6 sm:py-10"><Button variant="ghost" size="sm" asChild className="mb-5 -ml-3 gap-2"><Link href="/"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Torna agli articoli</Link></Button><div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] lg:items-start"><section className="grid gap-3 sm:grid-cols-2">{product.image_urls.map((imageUrl, index) => <div key={imageUrl} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted"><Image src={imageUrl} alt={`${product.title}, foto ${index + 1}`} fill priority={index === 0} sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" /></div>)}</section><aside className="lg:sticky lg:top-24"><div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-muted-foreground">{product.category?.name ?? 'Second hand'}</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight">{product.title}</h1></div><Button variant="outline" size="icon" aria-label="Aggiungi ai preferiti"><Heart className="h-5 w-5" aria-hidden="true" /></Button></div><p className="mt-4 text-3xl font-extrabold text-primary">{formatPrice(product.price_cents, product.currency)}</p><dl className="mt-6 grid grid-cols-2 gap-3 text-sm"><Detail label="Taglia" value={product.size} /><Detail label="Condizioni" value={conditionLabels[product.condition]} />{product.brand && <Detail label="Brand" value={product.brand} />}{product.color && <Detail label="Colore" value={product.color} />}</dl><div className="mt-6 border-t border-border pt-5"><BuyProductButton productId={product.id} isAuthenticated={Boolean(user)} isOwnProduct={isOwnProduct} isDemoMode={isDemoMode} /><Button variant="outline" size="lg" className="mt-3 w-full gap-2" asChild><Link href={user ? `/messages?product=${product.id}&to=${product.seller_id}` : `/login?next=${encodeURIComponent(`/products/${product.id}`)}`}><MessageCircle className="h-4 w-4" aria-hidden="true" />Scrivi al venditore</Link></Button></div><div className="mt-5 grid gap-3 border-t border-border pt-5"><p className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />{isDemoMode ? 'Ordine di prova senza pagamento' : 'Pagamento gestito in modo sicuro'}</p><p className="flex items-center gap-2 text-sm text-muted-foreground"><Truck className="h-4 w-4 text-primary" aria-hidden="true" />Spedizione secondo le opzioni del venditore</p></div></div><section className="mt-4 rounded-2xl border border-border bg-card p-5"><h2 className="font-bold">Descrizione</h2><p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{product.description}</p></section>{product.seller && <section className="mt-4 rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-sm text-muted-foreground">Venduto da</p><Link href={`/users/${product.seller.id}`} className="mt-0.5 inline-flex items-center gap-1 font-bold hover:text-primary">@{product.seller.username}<BadgeCheck className="h-4 w-4 text-primary" aria-label="Profilo verificato" /></Link></div><p className="flex items-center gap-1 text-sm font-semibold"><Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />{Number(product.seller.rating).toFixed(1)}</p></div>{product.seller.full_name && <p className="mt-2 text-sm text-muted-foreground">{product.seller.full_name}</p>}{product.seller.bio && <p className="mt-3 text-sm leading-6 text-muted-foreground">{product.seller.bio}</p>}{product.seller.location && <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" aria-hidden="true" />{product.seller.location}</p>}</section>}</aside></div></div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-muted p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-0.5 font-semibold">{value}</dd></div>;
}
