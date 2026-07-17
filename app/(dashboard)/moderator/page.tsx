import { ClipboardList } from 'lucide-react';

import { ModeratorReportsTable } from '@/components/dashboard/ModeratorReportsTable';
import { createClient } from '@/lib/supabase/server';
import { requireDashboardRole } from '@/lib/rbac';
import type { ModerationReport, ManagedProfile } from '@/types/rbac';
import type { Report } from '@/types/database';

export const metadata = { title: 'Coda report' };

export default async function ModeratorDashboardPage() {
  const actor = await requireDashboardRole('moderator');
  const supabase = createClient();
  const { data: reportData } = await supabase.from('reports').select('*').in('status', ['open', 'in_review', 'escalated']).order('created_at', { ascending: true }).limit(100);
  const reports = (reportData ?? []) as Report[];
  const profileIds = [...new Set(reports.flatMap((report) => [report.reporter_id, report.reported_user_id].filter((id): id is string => Boolean(id))))];
  const productIds = reports.map((report) => report.product_id).filter((id): id is string => Boolean(id));
  const [{ data: profileData }, { data: productData }] = await Promise.all([
    profileIds.length ? supabase.from('profiles').select('id, username, role, account_status').in('id', profileIds) : Promise.resolve({ data: [] }),
    productIds.length ? supabase.from('products').select('id, title, seller_id').in('id', productIds) : Promise.resolve({ data: [] })
  ]);
  const profiles = new Map((profileData ?? []).map((profile) => [profile.id, profile as Pick<ManagedProfile, 'id' | 'username' | 'role' | 'account_status'>]));
  const products = new Map((productData ?? []).map((product) => [product.id, product as { id: string; title: string; seller_id: string }]));
  const rows: ModerationReport[] = reports.map((report) => ({ ...report, reporter: profiles.get(report.reporter_id) ? { id: report.reporter_id, username: profiles.get(report.reporter_id)!.username, role: profiles.get(report.reporter_id)!.role } : null, reported_user: report.reported_user_id && profiles.get(report.reported_user_id) ? { id: report.reported_user_id, username: profiles.get(report.reported_user_id)!.username, role: profiles.get(report.reported_user_id)!.role, account_status: profiles.get(report.reported_user_id)!.account_status } : null, product: report.product_id ? products.get(report.product_id) ?? null : null }));
  return <div className="container max-w-7xl py-10 sm:py-14"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-primary">Moderazione</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Coda dei report</h1><p className="mt-3 text-muted-foreground">Esamina le segnalazioni standard e archivia gli annunci che violano le regole.</p></div><span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-sm font-bold text-primary"><ClipboardList className="h-4 w-4" aria-hidden="true" />{rows.length} aperti</span></div><section className="mt-8"><ModeratorReportsTable reports={rows} actorRole={actor.role} /></section></div>;
}
