import Link from 'next/link';
import { Inbox, Package, UserRound } from 'lucide-react';

import { MessageComposer } from '@/components/MessageComposer';
import { createClient } from '@/lib/supabase/server';
import type { Message, Profile } from '@/types/database';

interface MessagesPageProps {
  searchParams: { product?: string; to?: string };
}

export const metadata = { title: 'Messaggi' };
export const dynamic = 'force-dynamic';

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: messageData } = await supabase.from('messages').select('*').or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(50);
  const messages = (messageData ?? []) as Message[];
  const counterpartIds = [...new Set(messages.map((message) => message.sender_id === user.id ? message.recipient_id : message.sender_id))];
  const { data: profileData } = counterpartIds.length ? await supabase.from('profiles').select('id, username, full_name, avatar_url').in('id', counterpartIds) : { data: [] };
  const profiles = new Map((profileData ?? []).map((profile) => [profile.id, profile as Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>]));

  return <div className="container max-w-4xl py-10 sm:py-14"><div className="mb-8"><p className="text-sm font-semibold text-primary">La tua inbox</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Messaggi</h1></div><div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]"><section className="space-y-3">{messages.length ? messages.map((message) => { const counterpart = profiles.get(message.sender_id === user.id ? message.recipient_id : message.sender_id); return <article key={message.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="flex items-center gap-2 font-bold"><UserRound className="h-4 w-4 text-primary" aria-hidden="true" />{counterpart ? `@${counterpart.username}` : 'Utente Wearware'}</p><time className="text-xs text-muted-foreground" dateTime={message.created_at}>{new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium' }).format(new Date(message.created_at))}</time></div><p className="mt-2 text-sm text-muted-foreground">{message.body}</p>{message.product_id && <Link href={`/products/${message.product_id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"><Package className="h-3.5 w-3.5" aria-hidden="true" />Vai all’articolo</Link>}</article>; }) : <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center"><Inbox className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" /><p className="mt-3 font-semibold">Nessun messaggio</p><p className="mt-1 text-sm text-muted-foreground">Quando contatti o vieni contattato da un venditore, vedrai la conversazione qui.</p></div>}</section><MessageComposer recipientId={searchParams.to} productId={searchParams.product} /></div></div>;
}
