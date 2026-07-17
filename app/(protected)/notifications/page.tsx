import Link from 'next/link';
import { BellRing, Package } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import type { Order } from '@/types/database';

export const metadata = { title: 'Notifiche' };
export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: orderData } = await supabase.from('orders').select('*').or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).order('updated_at', { ascending: false }).limit(20);
  const orders = (orderData ?? []) as Order[];
  return <div className="container max-w-2xl py-10 sm:py-14"><p className="text-sm font-semibold text-primary">Aggiornamenti</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Notifiche</h1><div className="mt-8 space-y-3">{orders.length ? orders.map((order) => <Link key={order.id} href={`/orders/${order.id}`} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary"><span className="rounded-full bg-primary/10 p-2 text-primary"><Package className="h-5 w-5" aria-hidden="true" /></span><span><span className="block font-semibold">Ordine #{order.id.slice(0, 8).toUpperCase()}</span><span className="mt-1 block text-sm text-muted-foreground">Stato: {order.status}</span></span></Link>) : <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center"><BellRing className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" /><p className="mt-3 font-semibold">Tutto tranquillo</p><p className="mt-1 text-sm text-muted-foreground">Gli aggiornamenti su ordini e vendite compariranno qui.</p></div>}</div></div>;
}
