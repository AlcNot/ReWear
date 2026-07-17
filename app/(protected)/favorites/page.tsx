import { FavoriteProducts } from '@/components/FavoriteProducts';

export const metadata = { title: 'I miei preferiti' };

export default function FavoritesPage() {
  return <div className="container py-10 sm:py-14"><FavoriteProducts /></div>;
}
