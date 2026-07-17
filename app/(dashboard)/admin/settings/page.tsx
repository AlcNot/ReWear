import { Settings2, UserCog } from 'lucide-react';

import { AdminSettingsTable, type DashboardSettingRow } from '@/components/dashboard/AdminSettingsTable';
import { AdminUsersTable } from '@/components/dashboard/AdminUsersTable';
import { createClient } from '@/lib/supabase/server';
import { requireDashboardRole } from '@/lib/rbac';
import type { ManagedProfile } from '@/types/rbac';
import type { PlatformSetting } from '@/types/database';

export const metadata = { title: 'Impostazioni piattaforma' };

export default async function AdminSettingsPage() {
  const actor = await requireDashboardRole('admin');
  const supabase = createClient();
  const [{ data: profileData }, { data: settingData }] = await Promise.all([
    supabase.from('profiles').select('id, username, full_name, avatar_url, role, account_status, warning_count, featured_badge, created_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('platform_settings').select('*').order('setting_key', { ascending: true })
  ]);
  const users = (profileData ?? []) as ManagedProfile[];
  const settings: DashboardSettingRow[] = ((settingData ?? []) as PlatformSetting[]).map((setting) => ({ settingKey: setting.setting_key, settingValue: setting.setting_value, updatedAt: setting.updated_at }));
  return <div className="container max-w-7xl py-10 sm:py-14"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-primary">Amministrazione</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Impostazioni globali e ruoli</h1><p className="mt-3 max-w-3xl text-muted-foreground">Solo gli amministratori possono modificare configurazioni piattaforma e assegnare ruoli. Non puoi modificare il tuo stesso ruolo.</p></div><Settings2 className="h-9 w-9 text-primary" aria-hidden="true" /></div><section className="mt-10"><div className="mb-4 flex items-center gap-2"><UserCog className="h-5 w-5 text-primary" aria-hidden="true" /><div><h2 className="text-xl font-bold">Gestione ruoli</h2><p className="mt-1 text-sm text-muted-foreground">Sono mostrati gli ultimi 100 account creati.</p></div></div><AdminUsersTable users={users} currentUserId={actor.id} /></section><section className="mt-12"><div className="mb-4"><h2 className="text-xl font-bold">Configurazione piattaforma</h2><p className="mt-1 text-sm text-muted-foreground">Modifica i valori JSON solo se conosci l’effetto della configurazione.</p></div><AdminSettingsTable settings={settings} /></section></div>;
}
