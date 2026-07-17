'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import type { Product, ProductCondition } from '@/types/database';

const allowedShippingOptions = ['standard', 'express', 'pickup'] as const;
const allowedConditions = ['new_with_tags', 'new_without_tags', 'very_good', 'good', 'satisfactory'] as const;

function isWearwareStorageUrl(value: string) {
  try {
    const url = new URL(value);
    const configuredSupabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
    return url.origin === configuredSupabaseUrl.origin && url.pathname.startsWith('/storage/v1/object/public/product-images/');
  } catch {
    return false;
  }
}

export const createProductSchema = z.object({
  title: z.string().trim().min(3, 'Il titolo deve contenere almeno 3 caratteri.').max(120, 'Il titolo può contenere al massimo 120 caratteri.'),
  description: z.string().trim().min(10, 'La descrizione deve contenere almeno 10 caratteri.').max(5000, 'La descrizione può contenere al massimo 5000 caratteri.'),
  price: z.coerce.number().positive('Il prezzo deve essere maggiore di zero.').max(1_000_000, 'Il prezzo è troppo alto.'),
  categoryId: z.string().uuid('Seleziona una categoria valida.'),
  size: z.string().trim().min(1, 'Inserisci la taglia.').max(32, 'La taglia è troppo lunga.'),
  brand: z.string().trim().max(80, 'Il brand è troppo lungo.').optional().or(z.literal('')),
  color: z.string().trim().max(50, 'Il colore è troppo lungo.').optional().or(z.literal('')),
  condition: z.enum(allowedConditions),
  shippingOptions: z.array(z.enum(allowedShippingOptions)).min(1, 'Scegli almeno un metodo di spedizione.'),
  images: z.array(z.string().url('Ogni immagine deve avere un URL valido.').refine(isWearwareStorageUrl, 'Le immagini devono provenire dal bucket Wearware.')).min(1, 'Carica almeno un’immagine.').max(8, 'Puoi caricare al massimo 8 immagini.')
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreateProductResult = { success: true; data: Product } | { success: false; error: string };

export async function createProduct(input: unknown): Promise<CreateProductResult> {
  const parsedInput = createProductSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: parsedInput.error.issues[0]?.message ?? 'Dati dell’articolo non validi.' };
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Devi accedere per pubblicare un articolo.' };
  }

  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id')
    .eq('id', parsedInput.data.categoryId)
    .maybeSingle();

  if (categoryError || !category) {
    return { success: false, error: 'La categoria selezionata non è disponibile.' };
  }

  const payload = {
    seller_id: user.id,
    category_id: parsedInput.data.categoryId,
    title: parsedInput.data.title,
    description: parsedInput.data.description,
    price_cents: Math.round(parsedInput.data.price * 100),
    currency: 'EUR',
    size: parsedInput.data.size,
    brand: parsedInput.data.brand || null,
    color: parsedInput.data.color || null,
    condition: parsedInput.data.condition as ProductCondition,
    shipping_options: parsedInput.data.shippingOptions,
    image_urls: parsedInput.data.images,
    status: 'active' as const,
    published_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('products').insert(payload).select().single();
  if (error) {
    console.error('Could not create product:', error.message);
    return { success: false, error: 'Non è stato possibile pubblicare l’articolo. Riprova tra poco.' };
  }

  revalidatePath('/');
  revalidatePath('/sell');
  return { success: true, data };
}
