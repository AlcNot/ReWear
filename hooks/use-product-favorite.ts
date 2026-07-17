'use client';

import { useFavoriteStore } from '@/store/use-favorite-store';

export function useProductFavorite(productId: string) {
  const isFavorite = useFavoriteStore((state) => state.productIds.includes(productId));
  const toggleFavorite = useFavoriteStore((state) => state.toggle);

  return {
    isFavorite,
    toggleFavorite: () => toggleFavorite(productId)
  };
}
