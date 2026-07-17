import { BarChart3, CircleDollarSign, PackageCheck, TrendingUp } from 'lucide-react';

import { TrustedSalesTable, type TrustedSaleRow } from '@/components/dashboard/TrustedSalesTable';
import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';
import { requireDashboardRole } from '@/lib/rbac';
import type { Order } from '@/types/database';

export const metadata = { title: 'Creator Studio' };

export default async function TrustedDashboardPage() {
  const actor = await requireDashboardRole('trusted_user');
  const supabase = createClient();
  const { data: orderData } = await supabase.from('orders').select('*').eq('seller_id', actor.id).order('created_at', { ascending: false }).limit(100);
  const orders = (orderData ?? []) as Order[];
  const productIds = [...new Set(orders.map((order) => order.product_id))];
  const { data: productData } = productIds.length ? await supabase.from('products').select('id, title').in('id', productIds) : { data: [] };
  const productTitleById = new Map((productData ?? []).map((product) => [product.id, product.title]));
  const sales: TrustedSaleRow[] = orders.map((order) => ({ id: order.id, productTitle: productTitleById.get(order.product_id) ?? 'Articolo non disponibile', amountCents: order.amount_cents, currency: order.currency, status: order.status, createdAt: order.created_at }));
  const completedOrders = orders.filter((order) => order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered');
  const revenueCents = completedOrders.reduce((total, order) => total + order.amount_cents, 0);
  const deliveredOrders = orders.filter((order) => order.status === 'delivered').length;
  const conversion = orders.length ? Math.round((completedOrders.length / orders.length) * 100) : 0;

  return <div className="container max-w-6xl py-10 sm:py-14"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-primary">Creator Studio</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Analisi delle tue vendite</h1><p className="mt-3 text-muted-foreground">Strumenti avanzati riservati agli utenti fidati.</p></div><BarChart3 className="h-9 w-9 text-primary" aria-hidden="true" /></div><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<CircleDollarSign className="h-5 w-5" />} label="Ricavi confermati" value={formatPrice(revenueCents)} /><Metric icon={<PackageCheck className="h-5 w-5" />} label="Ordini consegnati" value={String(deliveredOrders)} /><Metric icon={<TrendingUp className="h-5 w-5" />} label="Conversione ordini" value={`${conversion}%`} /><Metric icon={<BarChart3 className="h-5 w-5" />} label="Ordini totali" value={String(orders.length)} /></div><section className="mt-10"><div className="mb-4"><h2 className="text-xl font-bold">Vendite recenti</h2><p className="mt-1 text-sm text-muted-foreground">Storico degli ultimi 100 ordini ricevuti.</p></div><TrustedSalesTable sales={sales} /></section></div>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <article className="rounded-2xl border border-border bg-card p-5 shadow-sm"><span className="inline-flex rounded-lg bg-primary/10 p-2 text-primary">{icon}</span><p className="mt-4 text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-extrabold tracking-tight">{value}</p></article>;
}
