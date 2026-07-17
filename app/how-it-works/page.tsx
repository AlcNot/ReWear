import Link from 'next/link';
import { Camera, CreditCard, PackageCheck, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';

const steps = [
  { icon: Camera, title: 'Pubblica in pochi minuti', text: 'Scatta foto nitide, aggiungi descrizione, taglia e prezzo del tuo capo.' },
  { icon: Search, title: 'Trova il tuo prossimo pezzo', text: 'Cerca tra gli annunci, salva i preferiti e contatta i venditori.' },
  { icon: CreditCard, title: 'Paga in sicurezza', text: 'Il checkout usa Stripe e crea un ordine tracciabile per entrambe le parti.' },
  { icon: PackageCheck, title: 'Spedisci e completa', text: 'Segui lo stato dell’ordine fino alla consegna e lascia una recensione.' }
];

export const metadata = { title: 'Come funziona' };

export default function HowItWorksPage() {
  return <div className="container max-w-5xl py-12 sm:py-20"><div className="mx-auto max-w-2xl text-center"><p className="text-sm font-semibold text-primary">Semplice e trasparente</p><h1 className="mt-2 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">La seconda vita di un capo inizia qui.</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">Wearware mette in contatto persone che vogliono acquistare e vendere moda pre-loved in modo più consapevole.</p></div><div className="mt-14 grid gap-4 sm:grid-cols-2">{steps.map((step, index) => <article key={step.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm"><span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</span><step.icon className="mt-5 h-7 w-7 text-primary" aria-hidden="true" /><h2 className="mt-3 text-xl font-bold">{step.title}</h2><p className="mt-2 leading-7 text-muted-foreground">{step.text}</p></article>)}</div><div className="mt-12 flex justify-center gap-3"><Button size="lg" asChild><Link href="/">Esplora articoli</Link></Button><Button variant="outline" size="lg" asChild><Link href="/sell">Vendi un capo</Link></Button></div></div>;
}
