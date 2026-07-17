'use client';

import { useState, useTransition } from 'react';
import { Archive, Check, ChevronUp, LoaderCircle, X } from 'lucide-react';

import { performModerationAction, resolveReport } from '@/app/actions/management';
import { Button } from '@/components/ui/button';
import type { AppRole, ModerationReport } from '@/types/rbac';

export function ReportActionControls({ report, actorRole }: { report: ModerationReport; actorRole: AppRole }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      setMessage(result.success ? 'Operazione completata.' : result.error ?? 'Operazione non riuscita.');
    });
  }

  if (report.status === 'resolved' || report.status === 'dismissed') return <span className="text-xs font-semibold text-muted-foreground">Chiuso</span>;

  return <div className="flex flex-wrap items-center gap-1.5"><Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => run(() => resolveReport(report.id, 'dismissed', 'Segnalazione chiusa senza intervento.'))} className="gap-1"><X className="h-3.5 w-3.5" aria-hidden="true" />Archivia</Button>{report.product_id && <Button type="button" size="sm" variant="destructive" disabled={isPending} onClick={() => run(async () => { const moderation = await performModerationAction(report.product_id!, 'listing', 'delete_listing'); if (!moderation.success) return moderation; return resolveReport(report.id, 'resolved', 'Annuncio archiviato dopo revisione.'); })} className="gap-1"><Archive className="h-3.5 w-3.5" aria-hidden="true" />Rimuovi</Button>}{actorRole === 'lead_moderator' || actorRole === 'admin' ? <Button type="button" size="sm" variant="secondary" disabled={isPending} onClick={() => run(() => resolveReport(report.id, 'escalated', 'Report inoltrato al livello di supervisione.'))} className="gap-1"><ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />Escala</Button> : null}{isPending && <LoaderCircle className="h-4 w-4 animate-spin text-primary" aria-label="Operazione in corso" />}{message && <span className="basis-full text-xs text-muted-foreground">{message}</span>}</div>;
}
