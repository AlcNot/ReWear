import Link from 'next/link';
import { BarChart3, Crown, LayoutDashboard, Settings, ShieldCheck, UsersRound } from 'lucide-react';

import { RoleBadge } from '@/components/dashboard/RoleBadge';
import { hasMinimumRole, type AppRole } from '@/types/rbac';

interface DashboardSidebarProps {
  role: AppRole;
}

const navigation = [
  { href: '/overview', label: 'Panoramica', icon: LayoutDashboard, minimumRole: 'user' as const },
  { href: '/trusted', label: 'Creator Studio', icon: BarChart3, minimumRole: 'trusted_user' as const },
  { href: '/moderator', label: 'Coda report', icon: ShieldCheck, minimumRole: 'moderator' as const },
  { href: '/supervisor', label: 'Supervisione', icon: UsersRound, minimumRole: 'lead_moderator' as const },
  { href: '/admin/settings', label: 'Impostazioni', icon: Settings, minimumRole: 'admin' as const }
];

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  return <aside className="border-b border-border bg-card lg:min-h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r"><div className="p-4 lg:sticky lg:top-16 lg:w-64"><div className="mb-5 flex items-center justify-between gap-2 rounded-xl bg-muted p-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ruolo attivo</p><div className="mt-1"><RoleBadge role={role} /></div></div><Crown className="h-5 w-5 text-primary" aria-hidden="true" /></div><nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Dashboard"><Link href="/" className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">Torna al marketplace</Link>{navigation.filter((item) => hasMinimumRole(role, item.minimumRole)).map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground"><Icon className="h-4 w-4" aria-hidden="true" />{item.label}</Link>; })}</nav></div></aside>;
}
