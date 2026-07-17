import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { requireDashboardRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const actor = await requireDashboardRole('user');
  return <div className="min-h-[calc(100vh-4rem)] bg-muted/30 lg:grid lg:grid-cols-[16rem_1fr]"><DashboardSidebar role={actor.role} /><div className="min-w-0">{children}</div></div>;
}
