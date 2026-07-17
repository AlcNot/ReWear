'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin, Star } from 'lucide-react';

import { useProductFavorite } from '@/hooks/use-product-favorite';
import { cn, formatPrice } from '@/lib/utils';
import type { ProductWithSeller } from '@/types/database';

interface ProductCardProps {
  product: ProductWithSeller;
  priority?: boolean;
  compact?: boolean;
}

const conditionLabels: Record<ProductWithSeller['condition'], string> = {
  new_with_tags: 'Nuovo con cartellino',
  new_without_tags: 'Nuovo senza cartellino',
  very_good: 'Ottime condizioni',
  good: 'Buone condizioni',
  satisfactory: 'Condizioni soddisfacenti'
};

export function ProductCard({ product, priority = false, compact = false }: ProductCardProps) {
  const { isFavorite, toggleFavorite } = useProductFavorite(product.id);
  const imageUrl = product.image_urls[0];

  return (
    <article className="group relative min-w-0">
      <Link href={`/products/${product.id}`} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label={`Visualizza ${product.title}`}>
        <div className={cn('relative overflow-hidden rounded-xl bg-muted', compact ? 'aspect-[4/5]' : 'aspect-[3/4]')}>
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            priority={priority}
            sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 20vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
          {product.status === 'reserved' && <span className="absolute left-2 top-2 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">Riservato</span>}
          {product.status === 'sold' && <span className="absolute left-2 top-2 rounded-full bg-foreground/80 px-2.5 py-1 text-xs font-semibold text-background">Venduto</span>}
        </div>
      </Link>

      <button
        type="button"
        onClick={toggleFavorite}
        aria-label={isFavorite ? `Rimuovi ${product.title} dai preferiti` : `Aggiungi ${product.title} ai preferiti`}
        aria-pressed={isFavorite}
        className={cn(
          'absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-background/90 shadow-sm backdrop-blur transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isFavorite ? 'text-rose-600' : 'text-foreground'
        )}
      >
        <Heart className={cn('h-5 w-5', isFavorite && 'fill-current')} aria-hidden="true" />
      </button>

      <div className={cn('space-y-1.5', compact ? 'pt-2' : 'pt-3')}>
        <div className="flex min-w-0 items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold leading-5 text-foreground">{product.title}</h3>
          <span className="shrink-0 text-sm font-bold text-foreground">{formatPrice(product.price_cents, product.currency)}</span>
        </div>
        <p className="line-clamp-1 text-xs text-muted-foreground">{product.brand ? `${product.brand} · ` : ''}Taglia {product.size}</p>
        {!compact && <p className="line-clamp-1 text-xs text-muted-foreground">{conditionLabels[product.condition]}</p>}
        {product.seller && (
          <div className="flex items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
            <span className="truncate">@{product.seller.username}</span>
            <span className="flex shrink-0 items-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />{Number(product.seller.rating).toFixed(1)}</span>
            {product.seller.full_name && <span className="sr-only">Venditore {product.seller.full_name}</span>}
          </div>
        )}
        {product.category?.name && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" aria-hidden="true" />{product.category.name}</span>}
      </div>
    </article>
  );
}
