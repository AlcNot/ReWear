'use client';

import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';

import { DataTable } from '@/components/ui/data-table';
import { formatPrice } from '@/lib/utils';
import type { OrderStatus } from '@/types/database';

export interface TrustedSaleRow {
  id: string;
  productTitle: string;
  amountCents: number;
  currency: string;
  status: OrderStatus;
  createdAt: string;
}

const statusLabel: Record<OrderStatus, string> = { pending: 'In attesa', paid: 'Pagato', shipped: 'Spedito', delivered: 'Consegnato', cancelled: 'Annullato', refunded: 'Rimborsato' };

export function TrustedSalesTable({ sales }: { sales: TrustedSaleRow[] }) {
  const columns = useMemo<ColumnDef<TrustedSaleRow, unknown>[]>(() => [
    { accessorKey: 'productTitle', header: 'Articolo', cell: ({ row }) => <span className="font-semibold">{row.original.productTitle}</span> },
    { accessorKey: 'amountCents', header: 'Importo', cell: ({ row }) => formatPrice(row.original.amountCents, row.original.currency) },
    { accessorKey: 'status', header: 'Stato', cell: ({ row }) => <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold">{statusLabel[row.original.status]}</span> },
    { accessorKey: 'createdAt', header: 'Data', cell: ({ row }) => new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium' }).format(new Date(row.original.createdAt)) }
  ], []);
  return <DataTable columns={columns} data={sales} emptyMessage="Non ci sono ancora vendite da analizzare." />;
}
