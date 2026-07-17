'use client';

import { FormEvent, useState } from 'react';
import { LoaderCircle, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface MessageComposerProps {
  recipientId?: string;
  productId?: string;
}

export function MessageComposer({ recipientId, productId }: MessageComposerProps) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  if (!recipientId) return null;
  const targetUserId = recipientId;

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedBody = body.trim();
    if (!trimmedBody) return;
    setError(null);
    setIsSending(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('La sessione è scaduta. Accedi di nuovo.');
      setIsSending(false);
      return;
    }
    const { error: insertError } = await supabase.from('messages').insert({ sender_id: user.id, recipient_id: targetUserId, product_id: productId ?? null, body: trimmedBody });
    setIsSending(false);
    if (insertError) {
      setError('Non è stato possibile inviare il messaggio.');
      return;
    }
    setBody('');
    router.refresh();
  }

  return <form onSubmit={sendMessage} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="font-bold">Invia un messaggio</h2><textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} maxLength={2000} placeholder="Fai una domanda al venditore..." className="mt-3 flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" required />{error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}<Button type="submit" className="mt-3 gap-2" disabled={isSending}>{isSending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}{isSending ? 'Invio...' : 'Invia messaggio'}</Button></form>;
}
