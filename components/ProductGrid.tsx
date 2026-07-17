'use client';

import { useMemo, useState } from 'react';
import { Grid2X2, LayoutList, SlidersHorizontal } from 'lucide-react';

import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/store/use-ui-store';
import type { ProductWithSeller } from '@/types/database';

interface ProductGridProps {
  products: ProductWithSeller[];
  title?: string;
  emptyMessage?: string;
  onFiltersClick?: () => void;
}

type SortOption = 'recent' | 'price-ascending' | 'price-descending';

export function ProductGrid({ products, title, emptyMessage = 'Nessun articolo trovato. Prova a modificare la ricerca o i filtri.', onFiltersClick }: ProductGridProps) {
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const density = useUiStore((state) => state.productGridDensity);
  const setDensity = useUiStore((state) => state.setProductGridDensity);

  const sortedProducts = useMemo(() => {
    return [...products].sort((first, second) => {
      if (sortOption === 'price-ascending') return first.price_cents - second.price_cents;
      if (sortOption === 'price-descending') return second.price_cents - first.price_cents;
      return new Date(second.published_at ?? second.created_at).getTime() - new Date(first.published_at ?? first.created_at).getTime();
    });
  }, [products, sortOption]);

  return (
    <section aria-labelledby="product-grid-title">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          {title && <h2 id="product-grid-title" className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>}
          <p className="text-sm text-muted-foreground">{products.length} {products.length === 1 ? 'articolo' : 'articoli'}</p>
        </div>
        <div className="flex items-center gap-2">
          {onFiltersClick && <Button type="button" variant="outline" size="sm" onClick={onFiltersClick} className="gap-2"><SlidersHorizontal className="h-4 w-4" aria-hidden="true" />Filtri</Button>}
          <label className="sr-only" htmlFor="sort-products">Ordina articoli</label>
          <select id="sort-products" value={sortOption} onChange={(event) => setSortOption(event.target.value as SortOption)} className="h-9 rounded-full border border-input bg-background px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-ring">
            <option value="recent">Più recenti</option>
            <option value="price-ascending">Prezzo: crescente</option>
            <option value="price-descending">Prezzo: decrescente</option>
          </select>
          <div className="hidden rounded-full border border-input p-0.5 sm:flex" aria-label="Densità griglia">
            <Button type="button" variant={density === 'comfortable' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setDensity('comfortable')} aria-label="Visualizzazione ampia" aria-pressed={density === 'comfortable'}><Grid2X2 className="h-4 w-4" aria-hidden="true" /></Button>
            <Button type="button" variant={density === 'compact' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setDensity('compact')} aria-label="Visualizzazione compatta" aria-pressed={density === 'compact'}><LayoutList className="h-4 w-4" aria-hidden="true" /></Button>
          </div>
        </div>
      </div>

      {sortedProducts.length > 0 ? (
        <div className={cn('grid gap-x-3 gap-y-7 sm:gap-x-4 sm:gap-y-8', density === 'comfortable' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6')}>
          {sortedProducts.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 5} compact={density === 'compact'} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center"><p className="text-base font-medium">Nessun risultato</p><p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{emptyMessage}</p></div>
      )}
    </section>
  );
}
