'use client';

import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';

import { PlatformSettingEditor } from '@/components/dashboard/PlatformSettingEditor';
import { DataTable } from '@/components/ui/data-table';

export interface DashboardSettingRow {
  settingKey: string;
  settingValue: Record<string, unknown>;
  updatedAt: string;
}

export function AdminSettingsTable({ settings }: { settings: DashboardSettingRow[] }) {
  const columns = useMemo<ColumnDef<DashboardSettingRow, unknown>[]>(() => [
    { accessorKey: 'settingKey', header: 'Chiave', cell: ({ row }) => <code className="font-semibold text-primary">{row.original.settingKey}</code> },
    { id: 'value', header: 'Valore JSON', cell: ({ row }) => <PlatformSettingEditor settingKey={row.original.settingKey} settingValue={row.original.settingValue} /> },
    { accessorKey: 'updatedAt', header: 'Ultimo aggiornamento', cell: ({ row }) => new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(row.original.updatedAt)) }
  ], []);
  return <DataTable columns={columns} data={settings} emptyMessage="Nessuna impostazione configurata." />;
}
