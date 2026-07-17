import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, Clock3, PackageCheck, Truck, XCircle } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';
import type { Order, Product } from '@/types/database';

const statusDetails = {
  pending: { label: 'Pagamento in attesa', icon: Clock3, tone: 'text-amber-700' },
  paid: { label: 'Pagamento confermato', icon: CheckCircle2, tone: 'text-primary' },
  shipped: { label: 'Spedito', icon: Truck, tone: 'text-primary' },
  delivered: { label: 'Consegnato', icon: PackageCheck, tone: 'text-primary' },
  cancelled: { label: 'Annullato', icon: XCircle, tone: 'text-destructive' },
  refunded: { label: 'Rimborsato', icon: XCircle, tone: 'text-destructive' }
} as const;

export const dynamic = 'force-dynamic';

export default async function OrderPage({ params, searchParams }: { params: { id: string }; searchParams: { checkout?: string } }) {
  const supabase = createClient();
  const { data: orderData } = await supabase.from('orders').select('*').eq('id', params.id).maybeSingle();
  if (!orderData) notFound();
  const order = orderData as Order;
  const { data: productData } = await supabase.from('products').select('*').eq('id', order.product_id).maybeSingle();
  const product = productData as Product | null;
  const status = statusDetails[order.status];
  const Icon = status.icon;

  return <div className="container max-w-2xl py-10 sm:py-14"><div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">{searchParams.checkout === 'success' && <div role="status" className="mb-6 rounded-xl bg-primary/10 p-4 text-sm text-primary">Il pagamento è stato completato. Stiamo aggiornando lo stato dell’ordine.</div>}<div className="flex items-start gap-3"><span className={`rounded-full bg-muted p-3 ${status.tone}`}><Icon className="h-6 w-6" aria-hidden="true" /></span><div><p className="text-sm text-muted-foreground">Ordine #{order.id.slice(0, 8).toUpperCase()}</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight">{status.label}</h1><p className="mt-2 text-sm text-muted-foreground">Creato il {new Intl.DateTimeFormat('it-IT', { dateStyle: 'long' }).format(new Date(order.created_at))}</p></div></div>{product && <div className="mt-7 flex gap-4 border-y border-border py-5"><div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-muted"><Image src={product.image_urls[0]} alt={product.title} fill sizes="80px" className="object-cover" /></div><div className="min-w-0"><p className="line-clamp-2 font-bold">{product.title}</p><p className="mt-1 text-sm text-muted-foreground">Taglia {product.size}</p><p className="mt-2 font-semibold">{formatPrice(order.amount_cents, order.currency)}</p></div></div>}<div className="mt-6 space-y-3 text-sm"><p><span className="font-semibold">Stato:</span> {status.label}</p>{order.tracking_number && <p><span className="font-semibold">Tracking:</span> {order.tracking_number}</p>}<p className="text-muted-foreground">Riceverai gli aggiornamenti qui e nella sezione notifiche.</p></div><Button variant="outline" className="mt-7" asChild><Link href="/">Continua a esplorare</Link></Button></div></div>;
}
