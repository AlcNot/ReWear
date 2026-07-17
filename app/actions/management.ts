'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { APP_ROLES, hasMinimumRole, ROLE_RANK, type AppRole, type ModerationAction, type ModerationTargetType, type PlatformStat } from '@/types/rbac';

type ActionResult<T = undefined> = (T extends undefined ? { success: true; data?: undefined } : { success: true; data: T }) | { success: false; error: string };

const userIdSchema = z.string().uuid('Identificatore utente non valido.');
const roleSchema = z.enum(APP_ROLES, { errorMap: () => ({ message: 'Ruolo non valido.' }) });
const moderationActionSchema = z.enum(['delete_listing', 'restore_listing', 'warn_user', 'ban_user', 'unban_user']);
const reportResolutionSchema = z.object({ reportId: z.string().uuid(), outcome: z.enum(['resolved', 'dismissed', 'escalated']), note: z.string().trim().min(3, 'Inserisci una nota di almeno 3 caratteri.').max(2000) });
const platformSettingSchema = z.object({ settingKey: z.string().regex(/^[a-z][a-z0-9_]{2,80}$/), settingValue: z.record(z.unknown()) });

interface Actor {
  id: string;
  role: AppRole;
  accountStatus: 'active' | 'warned' | 'banned';
}

async function getActor(requiredRole: AppRole): Promise<ActionResult<Actor>> {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { success: false, error: 'Devi accedere per eseguire questa operazione.' };

  const { data: profile, error: profileError } = await supabase.from('profiles').select('id, role, account_status').eq('id', user.id).maybeSingle();
  if (profileError || !profile) return { success: false, error: 'Profilo non disponibile.' };
  const actor = { id: profile.id, role: profile.role as AppRole, accountStatus: profile.account_status };
  if (actor.accountStatus === 'banned') return { success: false, error: 'Il tuo account è sospeso.' };
  if (!hasMinimumRole(actor.role, requiredRole)) return { success: false, error: 'Non hai i permessi necessari per questa operazione.' };
  return { success: true, data: actor };
}

async function writeModerationLog(input: { actorId: string; targetUserId?: string | null; targetProductId?: string | null; reportId?: string | null; action: ModerationAction; reason: string; metadata?: Record<string, unknown> }) {
  const admin = createAdminClient();
  const { error } = await admin.from('moderation_logs').insert({
    actor_id: input.actorId,
    target_user_id: input.targetUserId ?? null,
    target_product_id: input.targetProductId ?? null,
    report_id: input.reportId ?? null,
    action: input.action,
    reason: input.reason,
    metadata: input.metadata ?? {}
  });
  if (error) throw new Error('Non è stato possibile registrare il log di moderazione.');
}

export async function promoteUser(targetUserId: string, targetRole: string): Promise<ActionResult> {
  const parsedTargetId = userIdSchema.safeParse(targetUserId);
  const parsedRole = roleSchema.safeParse(targetRole);
  if (!parsedTargetId.success) return { success: false, error: parsedTargetId.error.issues[0]?.message ?? 'Identificatore utente non valido.' };
  if (!parsedRole.success) return { success: false, error: parsedRole.error.issues[0]?.message ?? 'Ruolo non valido.' };

  const actorResult = await getActor('admin');
  if (!actorResult.success) return actorResult;
  const actor = actorResult.data;
  if (actor.id === parsedTargetId.data) return { success: false, error: 'Non puoi modificare il tuo stesso ruolo.' };

  const admin = createAdminClient();
  const { data: target, error: targetError } = await admin.from('profiles').select('id, role, username').eq('id', parsedTargetId.data).maybeSingle();
  if (targetError || !target) return { success: false, error: 'Utente da aggiornare non trovato.' };
  if (target.role === parsedRole.data) return { success: false, error: 'L’utente possiede già questo ruolo.' };

  const { error: updateError } = await admin.from('profiles').update({ role: parsedRole.data, featured_badge: parsedRole.data === 'trusted_user' }).eq('id', target.id);
  if (updateError) return { success: false, error: 'Aggiornamento del ruolo non riuscito.' };

  await writeModerationLog({ actorId: actor.id, targetUserId: target.id, action: 'assign_role', reason: `Ruolo assegnato: ${parsedRole.data}.`, metadata: { previousRole: target.role, newRole: parsedRole.data, username: target.username } });
  revalidatePath('/dashboard/admin/settings');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function performModerationAction(targetId: string, type: ModerationTargetType, action: string): Promise<ActionResult> {
  const parsedTargetId = userIdSchema.safeParse(targetId);
  const parsedType = z.enum(['listing', 'user']).safeParse(type);
  const parsedAction = moderationActionSchema.safeParse(action);
  if (!parsedTargetId.success || !parsedType.success || !parsedAction.success) return { success: false, error: 'Richiesta di moderazione non valida.' };

  const requiredRole: AppRole = parsedType.data === 'listing' ? 'moderator' : 'lead_moderator';
  const actorResult = await getActor(requiredRole);
  if (!actorResult.success) return actorResult;
  const actor = actorResult.data;
  const admin = createAdminClient();
  let targetUserId: string;
  let targetProductId: string | null = null;

  if (parsedType.data === 'listing') {
    if (!['delete_listing', 'restore_listing'].includes(parsedAction.data)) return { success: false, error: 'Questa azione non è valida per un annuncio.' };
    const { data: product, error } = await admin.from('products').select('id, seller_id, title, status').eq('id', parsedTargetId.data).maybeSingle();
    if (error || !product) return { success: false, error: 'Annuncio non trovato.' };
    targetUserId = product.seller_id;
    targetProductId = product.id;
    const { data: targetProfile } = await admin.from('profiles').select('role').eq('id', targetUserId).maybeSingle();
    if (!targetProfile || ROLE_RANK[actor.role] <= ROLE_RANK[targetProfile.role as AppRole]) return { success: false, error: 'Non puoi moderare un annuncio di un utente con ruolo pari o superiore al tuo.' };
    const nextStatus = parsedAction.data === 'delete_listing' ? 'archived' : 'active';
    const { error: updateError } = await admin.from('products').update({ status: nextStatus, published_at: nextStatus === 'active' ? new Date().toISOString() : product.status === 'active' ? new Date().toISOString() : null }).eq('id', product.id);
    if (updateError) return { success: false, error: 'Aggiornamento dell’annuncio non riuscito.' };
    await writeModerationLog({ actorId: actor.id, targetUserId, targetProductId, action: parsedAction.data, reason: parsedAction.data === 'delete_listing' ? 'Annuncio archiviato per violazione segnalata.' : 'Annuncio ripristinato dopo revisione.', metadata: { title: product.title, previousStatus: product.status } });
  } else {
    const userAction = parsedAction.data;
    if (userAction !== 'warn_user' && userAction !== 'ban_user' && userAction !== 'unban_user') return { success: false, error: 'Questa azione non è valida per un utente.' };
    targetUserId = parsedTargetId.data;
    const { data: target, error } = await admin.from('profiles').select('id, role, account_status, warning_count, username').eq('id', targetUserId).maybeSingle();
    if (error || !target) return { success: false, error: 'Utente non trovato.' };
    if (actor.id === target.id || ROLE_RANK[actor.role] <= ROLE_RANK[target.role as AppRole]) return { success: false, error: 'Non puoi agire su un utente con ruolo pari o superiore al tuo.' };
    const profileUpdate = userAction === 'warn_user'
      ? { account_status: 'warned' as const, warning_count: target.warning_count + 1 }
      : { account_status: userAction === 'ban_user' ? 'banned' as const : 'active' as const, warning_count: target.warning_count };
    const { error: updateError } = await admin.from('profiles').update(profileUpdate).eq('id', target.id);
    if (updateError) return { success: false, error: 'Aggiornamento dello stato utente non riuscito.' };
    const reasonByAction: Record<'warn_user' | 'ban_user' | 'unban_user', string> = { warn_user: 'Avviso emesso per violazione delle regole.', ban_user: 'Account sospeso dopo revisione.', unban_user: 'Account riattivato dopo revisione.' };
    await writeModerationLog({ actorId: actor.id, targetUserId: target.id, action: userAction, reason: reasonByAction[userAction], metadata: { username: target.username, previousStatus: target.account_status, previousWarnings: target.warning_count } });
  }

  revalidatePath('/dashboard/moderator');
  revalidatePath('/dashboard/supervisor');
  revalidatePath('/dashboard/admin/settings');
  revalidatePath('/');
  return { success: true };
}

export async function getPlatformStats(): Promise<ActionResult<PlatformStat[]>> {
  const actorResult = await getActor('lead_moderator');
  if (!actorResult.success) return actorResult;
  const admin = createAdminClient();
  const [{ count: activeListings }, { count: openReports }, { count: bannedAccounts }, { count: paidOrders }] = await Promise.all([
    admin.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('reports').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_review', 'escalated']),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('account_status', 'banned'),
    admin.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'paid')
  ]);
  return { success: true, data: [
    { label: 'Annunci attivi', value: activeListings ?? 0, description: 'Disponibili nel marketplace' },
    { label: 'Report aperti', value: openReports ?? 0, description: 'Richiedono una revisione' },
    { label: 'Account sospesi', value: bannedAccounts ?? 0, description: 'Bloccati dalla piattaforma' },
    { label: 'Ordini pagati', value: paidOrders ?? 0, description: 'Con pagamento confermato' }
  ] };
}

export async function resolveReport(reportId: string, outcome: 'resolved' | 'dismissed' | 'escalated', note: string): Promise<ActionResult> {
  const parsed = reportResolutionSchema.safeParse({ reportId, outcome, note });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Dati del report non validi.' };
  const actorResult = await getActor('moderator');
  if (!actorResult.success) return actorResult;
  const actor = actorResult.data;
  const admin = createAdminClient();
  const { data: report, error: reportError } = await admin.from('reports').select('id, product_id, reported_user_id, status').eq('id', parsed.data.reportId).maybeSingle();
  if (reportError || !report) return { success: false, error: 'Report non trovato.' };
  if (report.status === 'escalated' && !hasMinimumRole(actor.role, 'lead_moderator')) return { success: false, error: 'Solo un Lead Moderator può chiudere un report escalato.' };
  const { error: updateError } = await admin.from('reports').update({ status: parsed.data.outcome, assigned_to: actor.id, resolution_note: parsed.data.note, resolved_at: parsed.data.outcome === 'escalated' ? null : new Date().toISOString() }).eq('id', report.id);
  if (updateError) return { success: false, error: 'Aggiornamento del report non riuscito.' };
  await writeModerationLog({ actorId: actor.id, targetUserId: report.reported_user_id, targetProductId: report.product_id, reportId: report.id, action: parsed.data.outcome === 'dismissed' ? 'dismiss_report' : 'resolve_report', reason: parsed.data.note, metadata: { outcome: parsed.data.outcome } });
  revalidatePath('/dashboard/moderator');
  revalidatePath('/dashboard/supervisor');
  return { success: true };
}

export async function updatePlatformSetting(settingKey: string, settingValue: Record<string, unknown>): Promise<ActionResult> {
  const parsed = platformSettingSchema.safeParse({ settingKey, settingValue });
  if (!parsed.success) return { success: false, error: 'Impostazione non valida.' };
  const actorResult = await getActor('admin');
  if (!actorResult.success) return actorResult;
  const { error } = await createAdminClient().from('platform_settings').upsert({ setting_key: parsed.data.settingKey, setting_value: parsed.data.settingValue, updated_by: actorResult.data.id }, { onConflict: 'setting_key' });
  if (error) return { success: false, error: 'Salvataggio impostazione non riuscito.' };
  revalidatePath('/dashboard/admin/settings');
  return { success: true };
}
