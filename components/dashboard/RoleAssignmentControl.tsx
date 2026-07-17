'use client';

import { useState, useTransition } from 'react';
import { LoaderCircle, Save } from 'lucide-react';

import { promoteUser } from '@/app/actions/management';
import { Button } from '@/components/ui/button';
import { APP_ROLES, ROLE_LABEL, type AppRole } from '@/types/rbac';

export function RoleAssignmentControl({ userId, currentRole, disabled }: { userId: string; currentRole: AppRole; disabled: boolean }) {
  const [role, setRole] = useState<AppRole>(currentRole);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await promoteUser(userId, role);
      setMessage(result.success ? 'Ruolo aggiornato.' : result.error ?? 'Operazione non riuscita.');
    });
  }

  return <div className="flex flex-wrap items-center gap-1.5"><select aria-label="Nuovo ruolo" value={role} onChange={(event) => setRole(event.target.value as AppRole)} disabled={disabled || isPending} className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium outline-none focus:ring-2 focus:ring-ring">{APP_ROLES.map((item) => <option key={item} value={item}>{ROLE_LABEL[item]}</option>)}</select><Button type="button" size="sm" disabled={disabled || isPending || role === currentRole} onClick={save} className="gap-1"><Save className="h-3.5 w-3.5" aria-hidden="true" />Salva</Button>{isPending && <LoaderCircle className="h-4 w-4 animate-spin text-primary" aria-label="Salvataggio in corso" />}{message && <span className="basis-full text-xs text-muted-foreground">{message}</span>}</div>;
}
