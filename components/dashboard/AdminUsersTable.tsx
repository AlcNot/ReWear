'use client';

import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';

import { RoleAssignmentControl } from '@/components/dashboard/RoleAssignmentControl';
import { RoleBadge } from '@/components/dashboard/RoleBadge';
import { DataTable } from '@/components/ui/data-table';
import type { ManagedProfile } from '@/types/rbac';

export function AdminUsersTable({ users, currentUserId }: { users: ManagedProfile[]; currentUserId: string }) {
  const columns = useMemo<ColumnDef<ManagedProfile, unknown>[]>(() => [
    { accessorKey: 'username', header: 'Utente', cell: ({ row }) => <div><p className="font-semibold">@{row.original.username}</p><p className="text-xs text-muted-foreground">{row.original.full_name ?? 'Nome non indicato'}</p></div> },
    { accessorKey: 'role', header: 'Ruolo attuale', cell: ({ row }) => <RoleBadge role={row.original.role} /> },
    { accessorKey: 'account_status', header: 'Account', cell: ({ row }) => <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold">{row.original.account_status}</span> },
    { accessorKey: 'warning_count', header: 'Avvisi', cell: ({ row }) => row.original.warning_count },
    { id: 'roleAssignment', header: 'Assegna ruolo', cell: ({ row }) => <RoleAssignmentControl userId={row.original.id} currentRole={row.original.role} disabled={row.original.id === currentUserId} /> }
  ], [currentUserId]);
  return <DataTable columns={columns} data={users} emptyMessage="Nessun utente disponibile." />;
}
