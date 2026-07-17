import { cn } from '@/lib/utils';
import { ROLE_LABEL, type AppRole } from '@/types/rbac';

const roleClasses: Record<AppRole, string> = {
  user: 'bg-slate-100 text-slate-700',
  trusted_user: 'bg-emerald-100 text-emerald-800',
  moderator: 'bg-sky-100 text-sky-800',
  lead_moderator: 'bg-violet-100 text-violet-800',
  admin: 'bg-rose-100 text-rose-800'
};

export function RoleBadge({ role }: { role: AppRole }) {
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-bold', roleClasses[role])}>{ROLE_LABEL[role]}</span>;
}
