'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const normalizedUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
      setError('Lo username deve avere 3-20 caratteri e usare solo lettere minuscole, numeri o _.');
      return;
    }
    setIsSubmitting(true);
    const { data, error: signUpError } = await createClient().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: fullName.trim(), username: normalizedUsername }
      }
    });
    setIsSubmitting(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      window.location.assign('/');
      return;
    }
    setMessage('Controlla la tua email e conferma l’indirizzo per attivare l’account.');
  }

  return <div className="container flex min-h-[calc(100vh-8rem)] max-w-md items-center py-12"><div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"><h1 className="text-3xl font-extrabold tracking-tight">Unisciti a Wearware</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Crea il tuo profilo e dai una seconda vita al tuo stile.</p><form onSubmit={handleSubmit} className="mt-7 space-y-5"><Field label="Nome"><Input autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} maxLength={100} required /></Field><Field label="Username"><Input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="es. martina_style" required /></Field><Field label="Email"><Input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></Field><Field label="Password"><Input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></Field>{error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}{message && <p role="status" className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p>}<Button type="submit" className="w-full gap-2" size="lg" disabled={isSubmitting}>{isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}{isSubmitting ? 'Creazione account...' : 'Crea account'}</Button><p className="text-center text-sm text-muted-foreground">Hai già un account? <Link href="/login" className="font-semibold text-primary hover:underline">Accedi</Link></p></form></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-semibold">{label}</span>{children}</label>;
}
