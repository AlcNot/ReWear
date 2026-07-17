import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { Navbar, type NavbarUser } from '@/components/Navbar';
import { QueryProvider } from '@/providers/query-provider';
import { createClient } from '@/lib/supabase/server';

import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'ReWear | La moda merita una seconda vita',
    template: '%s | ReWear'
  },
  description: 'Compra e vendi moda pre-loved nella community ReWear.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
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
          <footer className="mt-16 border-t border-border bg-card">
            <div className="container flex flex-col gap-3 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} ReWear. La moda merita una seconda vita.</p>
              <div className="flex gap-4"><a href="/how-it-works" className="hover:text-foreground">Come funziona</a><a href="/safety" className="hover:text-foreground">Sicurezza</a><a href="/terms" className="hover:text-foreground">Termini</a></div>
            </div>
          </footer>
        </QueryProvider>
      </body>
    </html>
  );
}
