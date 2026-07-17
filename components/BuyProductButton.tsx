'use client';

import { LoaderCircle, ShoppingBag } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

interface BuyProductButtonProps {
  productId: string;
  isAuthenticated: boolean;
  isOwnProduct: boolean;
  isDemoMode: boolean;
}

export function BuyProductButton({ productId, isAuthenticated, isOwnProduct, isDemoMode }: BuyProductButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function beginCheckout() {
    if (!isAuthenticated) {
      window.location.assign(`/login?next=${encodeURIComponent(`/products/${productId}`)}`);
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error ?? 'Non è stato possibile avviare il pagamento.');
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Non è stato possibile avviare il pagamento.');
      setIsLoading(false);
    }
  }

  if (isOwnProduct) return <p className="rounded-lg bg-muted px-4 py-3 text-center text-sm font-medium text-muted-foreground">Questo è il tuo articolo.</p>;

  return <div className="space-y-2"><Button type="button" size="lg" className="w-full gap-2" onClick={beginCheckout} disabled={isLoading}>{isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShoppingBag className="h-4 w-4" aria-hidden="true" />}{isLoading ? 'Creazione ordine...' : isDemoMode ? 'Conferma ordine di test' : 'Acquista ora'}</Button>{isDemoMode && <p className="text-center text-xs text-muted-foreground">Modalità demo: nessun pagamento verrà effettuato.</p>}{error && <p role="alert" className="text-center text-sm text-destructive">{error}</p>}</div>;
}
