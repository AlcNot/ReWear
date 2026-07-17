import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';

export const metadata = { title: 'Account sospeso' };

export default function SuspendedPage() {
  return <div className="container flex min-h-[calc(100vh-8rem)] max-w-xl items-center py-12"><section className="w-full rounded-2xl border border-border bg-card p-8 text-center shadow-sm"><span className="mx-auto inline-flex rounded-full bg-destructive/10 p-4 text-destructive"><ShieldAlert className="h-8 w-8" aria-hidden="true" /></span><h1 className="mt-5 text-3xl font-extrabold tracking-tight">Account sospeso</h1><p className="mt-3 leading-7 text-muted-foreground">Il tuo account non può accedere agli strumenti Wearware. Se ritieni che sia un errore, contatta l’assistenza fornendo il tuo username.</p><Button variant="outline" className="mt-7" asChild><Link href="/">Torna alla home</Link></Button></section></div>;
}
