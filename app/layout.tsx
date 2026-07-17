import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { Navbar, type NavbarUser } from '@/components/Navbar';
import { QueryProvider } from '@/providers/query-provider';
import { createClient } from '@/lib/supabase/server';

import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'Wearware | Lo stile fa il giro giusto',
    template: '%s | Wearware'
  },
  description: 'Compra e vendi moda pre-loved nella community Wearware.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://wearware.it')
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let navbarUser: NavbarUser | null = null;

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).maybeSingle();
    navbarUser = {
      id: user.id,
      email: user.email ?? null,
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null
    };
  }

  return (
    <html lang="it">
      <body className={inter.className}>
        <QueryProvider>
          <Navbar user={navbarUser} />
          <main>{children}</main>
          <footer className="mt-16 bg-[#191a37] text-white">
            <div className="container grid gap-10 py-12 sm:grid-cols-[1.4fr_1fr_1fr] sm:py-16">
              <div><p className="text-2xl font-black tracking-[-0.06em]">Wearware</p><p className="mt-3 max-w-sm text-sm leading-6 text-white/65">Pre-loved fashion per chi vuole far andare lo stile nella direzione giusta.</p></div>
              <div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#f9c845]">Esplora</p><div className="mt-4 grid gap-2 text-sm text-white/75"><a href="/" className="hover:text-white">Nuovi arrivi</a><a href="/sell" className="hover:text-white">Vendi un capo</a><a href="/how-it-works" className="hover:text-white">Come funziona</a></div></div>
              <div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#f9c845]">Supporto</p><div className="mt-4 grid gap-2 text-sm text-white/75"><a href="/safety" className="hover:text-white">Sicurezza</a><a href="/terms" className="hover:text-white">Termini</a><a href="/login" className="hover:text-white">Accedi</a></div></div>
            </div>
            <div className="border-t border-white/10"><div className="container py-5 text-xs text-white/50">© {new Date().getFullYear()} Wearware. Wear it forward.</div></div>
          </footer>
        </QueryProvider>
      </body>
    </html>
  );
}
