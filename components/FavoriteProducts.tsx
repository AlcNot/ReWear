'use client';

import { useQuery } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';

import { ProductGrid } from '@/components/ProductGrid';
import { createClient } from '@/lib/supabase/client';
import { useFavoriteStore } from '@/store/use-favorite-store';
import type { Category, Product, ProductWithSeller, Profile } from '@/types/database';

async function fetchFavoriteProducts(productIds: string[]) {
  if (productIds.length === 0) return [];
  const supabase = createClient();
  const { data: products, error } = await supabase.from('products').select('*').in('id', productIds);
  if (error) throw error;
  const productRows = (products ?? []) as Product[];
  const sellerIds = [...new Set(productRows.map((product) => product.seller_id))];
  const categoryIds = [...new Set(productRows.map((product) => product.category_id).filter((id): id is string => Boolean(id)))];
  const [{ data: sellers }, { data: categories }] = await Promise.all([
    sellerIds.length ? supabase.from('profiles').select('id, username, full_name, avatar_url, rating').in('id', sellerIds) : Promise.resolve({ data: [] }),
    categoryIds.length ? supabase.from('categories').select('id, name, slug').in('id', categoryIds) : Promise.resolve({ data: [] })
  ]);
  const sellerById = new Map((sellers ?? []).map((seller) => [seller.id, seller as Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url' | 'rating'>]));
  const categoryById = new Map((categories ?? []).map((category) => [category.id, category as Pick<Category, 'id' | 'name' | 'slug'>]));
  return productRows.map((product) => ({ ...product, seller: sellerById.get(product.seller_id) ?? null, category: product.category_id ? categoryById.get(product.category_id) ?? null : null })) as ProductWithSeller[];
}

export function FavoriteProducts() {
  const productIds = useFavoriteStore((state) => state.productIds);
  const { data = [], isPending, error } = useQuery({ queryKey: ['favorite-products', productIds], queryFn: () => fetchFavoriteProducts(productIds) });

  if (isPending) return <div className="flex min-h-64 items-center justify-center text-muted-foreground"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />Caricamento preferiti...</div>;
  if (error) return <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">Non è stato possibile caricare i preferiti.</p>;
  return <ProductGrid products={data} title="I tuoi preferiti" emptyMessage="Quando salvi un articolo con il cuore, lo ritrovi qui." />;
}
