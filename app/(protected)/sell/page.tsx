import { SellProductForm } from '@/components/SellProductForm';
import { createClient } from '@/lib/supabase/server';
import type { Category } from '@/types/database';

export const metadata = { title: 'Vendi un articolo' };
export const dynamic = 'force-dynamic';

export default async function SellPage() {
  const supabase = createClient();
  const { data: categories } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });

  return (
    <div className="container max-w-3xl py-10 sm:py-14">
      <div className="mb-8"><p className="text-sm font-semibold text-primary">Vendi su Wearware</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Pubblica il tuo articolo</h1><p className="mt-3 text-muted-foreground">Inserisci informazioni accurate per aiutare gli acquirenti a scegliere con fiducia.</p></div>
      <SellProductForm categories={(categories ?? []) as Category[]} />
    </div>
  );
}
