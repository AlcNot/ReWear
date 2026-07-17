'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ArrowUpRight, Bell, Heart, LogOut, Menu, MessageCircle, Search, Sparkles, UserRound, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { cn, getInitials } from '@/lib/utils';

export interface NavbarUser {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

interface NavbarProps {
  user: NavbarUser | null;
}

const navigationItems = [
  { href: '/', label: 'Esplora' },
  { href: '/sell', label: 'Vendi' },
  { href: '/how-it-works', label: 'Come funziona' }
];

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchTerm.trim();
    router.push(query ? `/?q=${encodeURIComponent(query)}` : '/');
    setIsMenuOpen(false);
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-[4.5rem] items-center gap-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-xl font-black tracking-[-0.06em] text-foreground" aria-label="Wearware, torna alla home">
          <span className="grid h-9 w-9 place-items-center rounded-[0.7rem] bg-[#191a37] text-[#f9c845]"><Sparkles className="h-5 w-5" aria-hidden="true" /></span>
          <span>Wearware</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigazione principale">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-full px-3 py-2 text-sm font-bold transition-colors hover:bg-accent',
                pathname === item.href ? 'bg-accent text-foreground' : 'text-muted-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={handleSearch} className="relative ml-auto hidden max-w-md flex-1 md:block" role="search">
          <label htmlFor="site-search" className="sr-only">Cerca capi, brand o taglie</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input id="site-search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Cerca capi, brand, taglie..." className="h-10 rounded-full border-transparent bg-muted pl-9 pr-3 focus-visible:border-primary" />
        </form>

        <div className="ml-auto hidden items-center gap-1 md:flex lg:ml-0">
          {user ? (
            <>
              <Button variant="ghost" size="icon" asChild><Link href="/favorites" aria-label="I miei preferiti"><Heart className="h-5 w-5" aria-hidden="true" /></Link></Button>
              <Button variant="ghost" size="icon" asChild><Link href="/messages" aria-label="Messaggi"><MessageCircle className="h-5 w-5" aria-hidden="true" /></Link></Button>
              <Button variant="ghost" size="icon" asChild><Link href="/notifications" aria-label="Notifiche"><Bell className="h-5 w-5" aria-hidden="true" /></Link></Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/profile" className="gap-2 pl-1.5"><span className="grid h-6 w-6 place-items-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">{getInitials(user.fullName ?? user.email)}</span><span className="max-w-24 truncate">{user.fullName?.split(' ')[0] ?? 'Profilo'}</span></Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut} disabled={isSigningOut} aria-label="Esci"><LogOut className="h-4 w-4" aria-hidden="true" /></Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild><Link href="/login">Accedi</Link></Button>
              <Button asChild><Link href="/signup" className="gap-1.5">Inizia ora <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></Button>
            </>
          )}
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen((open) => !open)} aria-label={isMenuOpen ? 'Chiudi menu' : 'Apri menu'} aria-expanded={isMenuOpen} aria-controls="mobile-navigation">
          {isMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </Button>
      </div>

      {isMenuOpen && (
        <div id="mobile-navigation" className="border-t border-border bg-background px-4 py-4 md:hidden">
          <form onSubmit={handleSearch} className="relative mb-4" role="search">
            <label htmlFor="mobile-site-search" className="sr-only">Cerca capi, brand o taglie</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="mobile-site-search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Cerca..." className="rounded-full bg-muted pl-9" />
          </form>
          <nav className="grid gap-1" aria-label="Navigazione mobile">
            {navigationItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} className="rounded-lg px-3 py-2.5 font-medium hover:bg-accent">{item.label}</Link>)}
            {user ? (
              <>
                <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 font-medium hover:bg-accent"><UserRound className="h-4 w-4" aria-hidden="true" />Profilo</Link>
                <Link href="/messages" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 font-medium hover:bg-accent"><MessageCircle className="h-4 w-4" aria-hidden="true" />Messaggi</Link>
                <button type="button" onClick={handleSignOut} disabled={isSigningOut} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left font-medium hover:bg-accent disabled:opacity-50"><LogOut className="h-4 w-4" aria-hidden="true" />Esci</button>
              </>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2"><Button variant="outline" asChild><Link href="/login" onClick={() => setIsMenuOpen(false)}>Accedi</Link></Button><Button asChild><Link href="/signup" onClick={() => setIsMenuOpen(false)}>Registrati</Link></Button></div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
