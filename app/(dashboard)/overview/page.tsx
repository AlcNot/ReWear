import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

import { RoleBadge } from '@/components/dashboard/RoleBadge';
import { Button } from '@/components/ui/button';
import { requireDashboardRole } from '@/lib/rbac';
import { hasMinimumRole } from '@/types/rbac';

export default async function DashboardOverviewPage() {
  const actor = await requireDashboardRole('user');
  const destination = hasMinimumRole(actor.role, 'trusted_user') ? '/trusted' : '/sell';
  const destinationLabel = hasMinimumRole(actor.role, 'trusted_user') ? 'Apri Creator Studio' : 'Pubblica un articolo';
  return <div className="container max-w-5xl py-10 sm:py-14"><p className="text-sm font-semibold text-primary">Dashboard ReWear</p><div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-extrabold tracking-tight">Ciao, @{actor.username}</h1><RoleBadge role={actor.role} /></div><p className="mt-3 max-w-2xl text-muted-foreground">Gestisci il tuo armadio e accedi agli strumenti disponibili per il tuo ruolo. Le autorizzazioni sono sempre verificate dal server.</p><div className="mt-8 grid gap-4 sm:grid-cols-2"><section className="rounded-2xl border border-border bg-card p-6 shadow-sm"><Sparkles className="h-7 w-7 text-primary" aria-hidden="true" /><h2 className="mt-4 text-lg font-bold">Il tuo marketplace</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Pubblica articoli, rispondi ai messaggi e segui gli ordini in un unico posto.</p><Button className="mt-5 gap-2" asChild><Link href={destination}>{destinationLabel}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Button></section><section className="rounded-2xl border border-border bg-card p-6 shadow-sm"><ShieldCheck className="h-7 w-7 text-primary" aria-hidden="true" /><h2 className="mt-4 text-lg font-bold">Sicurezza dei ruoli</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Il ruolo attivo determina le sezioni visibili, ma le azioni sensibili sono autorizzate nuovamente sul server.</p></section></div></div>;
}
