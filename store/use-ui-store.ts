'use client';

import { create } from 'zustand';

export type ProductGridDensity = 'comfortable' | 'compact';

interface UiState {
  productGridDensity: ProductGridDensity;
  setProductGridDensity: (density: ProductGridDensity) => void;
}

export const useUiStore = create<UiState>((set) => ({
  productGridDensity: 'comfortable',
  setProductGridDensity: (productGridDensity) => set({ productGridDensity })
}));
