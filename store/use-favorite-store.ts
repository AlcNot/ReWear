'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface FavoriteState {
  productIds: string[];
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (productId) => {
        const exists = get().productIds.includes(productId);
        set({ productIds: exists ? get().productIds.filter((id) => id !== productId) : [...get().productIds, productId] });
      },
      has: (productId) => get().productIds.includes(productId)
    }),
    {
      name: 'rewear-favorites',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
