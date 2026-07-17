'use client';

import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';

import { RoleBadge } from '@/components/dashboard/RoleBadge';
import { UserModerationControls } from '@/components/dashboard/UserModerationControls';
import { DataTable } from '@/components/ui/data-table';
import type { ModerationLog } from '@/types/rbac';

export function SupervisorLogsTable({ logs }: { logs: ModerationLog[] }) {
  const columns = useMemo<ColumnDef<ModerationLog, unknown>[]>(() => [
    { id: 'actor', header: 'Operatore', cell: ({ row }) => <div><p className="font-semibold">@{row.original.actor?.username ?? 'sistema'}</p>{row.original.actor && <div className="mt-1"><RoleBadge role={row.original.actor.role} /></div>}</div> },
    { accessorKey: 'action', header: 'Azione', cell: ({ row }) => <span className="font-mono text-xs font-semibold">{row.original.action}</span> },
    { id: 'target', header: 'Destinazione', cell: ({ row }) => row.original.target_product?.title ?? (row.original.target_user ? `@${row.original.target_user.username}` : 'Contenuto non disponibile') },
    { accessorKey: 'reason', header: 'Motivazione', cell: ({ row }) => <p className="max-w-64 text-xs leading-5 text-muted-foreground">{row.original.reason}</p> },
    { accessorKey: 'created_at', header: 'Data', cell: ({ row }) => new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(row.original.created_at)) },
    { id: 'userActions', header: 'Escalation', cell: ({ row }) => row.original.target_user ? <UserModerationControls userId={row.original.target_user.id} accountStatus={row.original.target_user.account_status} /> : <span className="text-xs text-muted-foreground">N/A</span> }
  ], []);
  return <DataTable columns={columns} data={logs} emptyMessage="Non ci sono azioni di moderazione registrate." />;
}
