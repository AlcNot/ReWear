'use client';

import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';

import { ReportActionControls } from '@/components/dashboard/ReportActionControls';
import { RoleBadge } from '@/components/dashboard/RoleBadge';
import { DataTable } from '@/components/ui/data-table';
import type { AppRole, ModerationReport } from '@/types/rbac';

export function ModeratorReportsTable({ reports, actorRole }: { reports: ModerationReport[]; actorRole: AppRole }) {
  const columns = useMemo<ColumnDef<ModerationReport, unknown>[]>(() => [
    { accessorKey: 'reason', header: 'Segnalazione', cell: ({ row }) => <div className="max-w-56"><p className="font-semibold">{row.original.reason}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{row.original.details ?? 'Nessun dettaglio aggiuntivo.'}</p></div> },
    { id: 'target', header: 'Contenuto segnalato', cell: ({ row }) => <div className="max-w-52"><p className="font-medium">{row.original.product?.title ?? `@${row.original.reported_user?.username ?? 'utente rimosso'}`}</p>{row.original.reported_user && <div className="mt-1"><RoleBadge role={row.original.reported_user.role} /></div>}</div> },
    { id: 'reporter', header: 'Segnalato da', cell: ({ row }) => `@${row.original.reporter?.username ?? 'utente'}` },
    { accessorKey: 'status', header: 'Stato', cell: ({ row }) => <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold">{row.original.status}</span> },
    { accessorKey: 'created_at', header: 'Data', cell: ({ row }) => new Intl.DateTimeFormat('it-IT', { dateStyle: 'short' }).format(new Date(row.original.created_at)) },
    { id: 'actions', header: 'Azioni', cell: ({ row }) => <ReportActionControls report={row.original} actorRole={actorRole} /> }
  ], [actorRole]);
  return <DataTable columns={columns} data={reports} emptyMessage="La coda di moderazione è vuota." />;
}
