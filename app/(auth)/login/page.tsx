'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const { error: signInError } = await createClient().auth.signInWithPassword({ email, password });
    setIsSubmitting(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    const requestedPath = new URLSearchParams(window.location.search).get('next');
    router.replace(requestedPath?.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/');
    router.refresh();
  }

  return <AuthShell title="Bentornato" subtitle="Accedi per continuare a comprare e vendere su Wearware."><form onSubmit={handleSubmit} className="space-y-5"><Field label="Email"><Input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></Field><Field label="Password"><Input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></Field>{error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}<Button type="submit" className="w-full gap-2" size="lg" disabled={isSubmitting}>{isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}{isSubmitting ? 'Accesso in corso...' : 'Accedi'}</Button><p className="text-center text-sm text-muted-foreground">Non hai un account? <Link href="/signup" className="font-semibold text-primary hover:underline">Registrati</Link></p></form></AuthShell>;
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="container flex min-h-[calc(100vh-8rem)] max-w-md items-center py-12"><div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"><h1 className="text-3xl font-extrabold tracking-tight">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p><div className="mt-7">{children}</div></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-semibold">{label}</span>{children}</label>;
}
