import { ShieldCheck } from 'lucide-react';

export const metadata = { title: 'Sicurezza' };

export default function SafetyPage() {
  return <div className="container max-w-3xl py-12 sm:py-16"><div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"><ShieldCheck className="h-9 w-9 text-primary" aria-hidden="true" /><h1 className="mt-4 text-3xl font-extrabold tracking-tight">Acquista e vendi con attenzione</h1><div className="mt-6 space-y-5 text-sm leading-7 text-muted-foreground"><p>Usa sempre il checkout Wearware per gli acquisti: lo stato dell’ordine e il pagamento restano così tracciabili. Non condividere dati della carta, codici di verifica o password in chat.</p><p>Descrivi gli articoli in modo fedele, fotografa eventuali difetti e conserva la prova di spedizione. Se qualcosa non sembra corretto, interrompi la conversazione e contatta l’assistenza della piattaforma.</p><p>Le regole RLS del progetto limitano i dati privati alle persone coinvolte: messaggi e ordini sono visibili soltanto ai rispettivi partecipanti.</p></div></div></div>;
}
