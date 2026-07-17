import { ClipboardCheck, ShieldAlert, UsersRound } from 'lucide-react';

import { SupervisorLogsTable } from '@/components/dashboard/SupervisorLogsTable';
import { createClient } from '@/lib/supabase/server';
import { requireDashboardRole } from '@/lib/rbac';
import type { ManagedProfile, ModerationLog } from '@/types/rbac';
import type { ModerationLogRow } from '@/types/database';

export const metadata = { title: 'Supervisione moderazione' };

export default async function SupervisorDashboardPage() {
  await requireDashboardRole('lead_moderator');
  const supabase = createClient();
  const { data: logData } = await supabase.from('moderation_logs').select('*').order('created_at', { ascending: false }).limit(100);
  const logs = (logData ?? []) as ModerationLogRow[];
  const userIds = [...new Set(logs.flatMap((log) => [log.actor_id, log.target_user_id].filter((id): id is string => Boolean(id))))];
  const productIds = logs.map((log) => log.target_product_id).filter((id): id is string => Boolean(id));
  const [{ data: profileData }, { data: productData }] = await Promise.all([
    userIds.length ? supabase.from('profiles').select('id, username, role, account_status').in('id', userIds) : Promise.resolve({ data: [] }),
    productIds.length ? supabase.from('products').select('id, title').in('id', productIds) : Promise.resolve({ data: [] })
  ]);
  const profiles = new Map((profileData ?? []).map((profile) => [profile.id, profile as Pick<ManagedProfile, 'id' | 'username' | 'role' | 'account_status'>]));
  const products = new Map((productData ?? []).map((product) => [product.id, product as { id: string; title: string }]));
  const rows: ModerationLog[] = logs.map((log) => ({ ...log, action: log.action as ModerationLog['action'], actor: profiles.get(log.actor_id) ? { id: log.actor_id, username: profiles.get(log.actor_id)!.username, role: profiles.get(log.actor_id)!.role } : null, target_user: log.target_user_id && profiles.get(log.target_user_id) ? { id: log.target_user_id, username: profiles.get(log.target_user_id)!.username, role: profiles.get(log.target_user_id)!.role, account_status: profiles.get(log.target_user_id)!.account_status } : null, target_product: log.target_product_id ? products.get(log.target_product_id) ?? null : null }));
  const bans = rows.filter((log) => log.action === 'ban_user').length;
  const escalations = rows.filter((log) => log.action === 'resolve_report' && log.metadata.outcome === 'escalated').length;
  return <div className="container max-w-7xl py-10 sm:py-14"><div><p className="text-sm font-semibold text-primary">Lead Moderation</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Supervisione e dispute</h1><p className="mt-3 max-w-3xl text-muted-foreground">Rivedi le azioni del team, intercetta le escalation e intervieni su avvisi o sospensioni degli account di livello inferiore.</p></div><div className="mt-8 grid gap-4 sm:grid-cols-3"><Summary icon={<ClipboardCheck className="h-5 w-5" />} label="Azioni registrate" value={String(rows.length)} /><Summary icon={<ShieldAlert className="h-5 w-5" />} label="Sospensioni recenti" value={String(bans)} /><Summary icon={<UsersRound className="h-5 w-5" />} label="Escalation" value={String(escalations)} /></div><section className="mt-10"><div className="mb-4"><h2 className="text-xl font-bold">Audit log</h2><p className="mt-1 text-sm text-muted-foreground">Ultime 100 azioni registrate dal sistema di moderazione.</p></div><SupervisorLogsTable logs={rows} /></section></div>;
}

function Summary({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <article className="rounded-2xl border border-border bg-card p-5 shadow-sm"><span className="inline-flex rounded-lg bg-primary/10 p-2 text-primary">{icon}</span><p className="mt-4 text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-extrabold">{value}</p></article>;
}
