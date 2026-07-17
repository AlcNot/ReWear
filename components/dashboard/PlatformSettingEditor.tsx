'use client';

import { useState, useTransition } from 'react';
import { LoaderCircle, Save } from 'lucide-react';

import { updatePlatformSetting } from '@/app/actions/management';
import { Button } from '@/components/ui/button';

export function PlatformSettingEditor({ settingKey, settingValue }: { settingKey: string; settingValue: Record<string, unknown> }) {
  const [value, setValue] = useState(() => JSON.stringify(settingValue, null, 2));
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    let parsedValue: Record<string, unknown>;
    try {
      const candidate = JSON.parse(value) as unknown;
      if (!candidate || Array.isArray(candidate) || typeof candidate !== 'object') throw new Error('not-object');
      parsedValue = candidate as Record<string, unknown>;
    } catch {
      setMessage('Inserisci un oggetto JSON valido.');
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await updatePlatformSetting(settingKey, parsedValue);
      setMessage(result.success ? 'Impostazione salvata.' : result.error ?? 'Salvataggio non riuscito.');
    });
  }

  return <div className="space-y-2"><textarea aria-label={`Valore JSON di ${settingKey}`} value={value} onChange={(event) => setValue(event.target.value)} rows={5} spellCheck={false} className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs leading-5 outline-none focus:ring-2 focus:ring-ring" /><div className="flex items-center gap-2"><Button type="button" size="sm" onClick={save} disabled={isPending} className="gap-1">{isPending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Save className="h-3.5 w-3.5" aria-hidden="true" />}Salva</Button>{message && <span className="text-xs text-muted-foreground">{message}</span>}</div></div>;
}
