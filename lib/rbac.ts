import 'server-only';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { hasMinimumRole, type AccountStatus, type AppRole } from '@/types/rbac';

export interface DashboardActor {
  id: string;
  username: string;
  fullName: string | null;
  role: AppRole;
  accountStatus: AccountStatus;
}

export async function requireDashboardRole(requiredRole: AppRole): Promise<DashboardActor> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/overview');

  const { data: profile } = await supabase.from('profiles').select('id, username, full_name, role, account_status').eq('id', user.id).maybeSingle();
  if (!profile) redirect('/login?error=profile_unavailable');
  const actor: DashboardActor = { id: profile.id, username: profile.username, fullName: profile.full_name, role: profile.role as AppRole, accountStatus: profile.account_status as AccountStatus };
  if (actor.accountStatus === 'banned') redirect('/suspended');
  if (!hasMinimumRole(actor.role, requiredRole)) redirect('/?error=dashboard_forbidden');
  return actor;
}
