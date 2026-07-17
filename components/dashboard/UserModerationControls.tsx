'use client';

import { useState, useTransition } from 'react';
import { LoaderCircle, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-react';

import { performModerationAction } from '@/app/actions/management';
import { Button } from '@/components/ui/button';
import type { AccountStatus } from '@/types/rbac';

export function UserModerationControls({ userId, accountStatus }: { userId: string; accountStatus: AccountStatus }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function moderate(action: 'warn_user' | 'ban_user' | 'unban_user') {
    setMessage(null);
    startTransition(async () => {
      const result = await performModerationAction(userId, 'user', action);
      setMessage(result.success ? 'Stato utente aggiornato.' : result.error ?? 'Operazione non riuscita.');
    });
  }

  return <div className="flex flex-wrap items-center gap-1.5"><Button type="button" size="sm" variant="outline" disabled={isPending || accountStatus === 'banned'} onClick={() => moderate('warn_user')} className="gap-1"><TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />Avvisa</Button>{accountStatus === 'banned' ? <Button type="button" size="sm" variant="secondary" disabled={isPending} onClick={() => moderate('unban_user')} className="gap-1"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />Riattiva</Button> : <Button type="button" size="sm" variant="destructive" disabled={isPending} onClick={() => moderate('ban_user')} className="gap-1"><ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />Sospendi</Button>}{isPending && <LoaderCircle className="h-4 w-4 animate-spin text-primary" aria-label="Operazione in corso" />}{message && <span className="basis-full text-xs text-muted-foreground">{message}</span>}</div>;
}
