'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, LoaderCircle, Trash2, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { createProduct, createProductSchema, type CreateProductInput } from '@/app/actions/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import type { Category, ProductCondition } from '@/types/database';

interface SellProductFormProps {
  categories: Category[];
}

const conditions: Array<{ value: ProductCondition; label: string }> = [
  { value: 'new_with_tags', label: 'Nuovo con cartellino' },
  { value: 'new_without_tags', label: 'Nuovo senza cartellino' },
  { value: 'very_good', label: 'Ottime condizioni' },
  { value: 'good', label: 'Buone condizioni' },
  { value: 'satisfactory', label: 'Condizioni soddisfacenti' }
];

export function SellProductForm({ categories }: SellProductFormProps) {
  const router = useRouter();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      categoryId: '',
      size: '',
      brand: '',
      color: '',
      condition: 'very_good',
      shippingOptions: ['standard'],
      images: []
    }
  });
  const shippingOptions = watch('shippingOptions');

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (imageUrls.length + files.length > 8) {
      setSubmitError('Puoi caricare al massimo 8 immagini.');
      return;
    }

    const filesToUpload = Array.from(files);
    const invalidFile = filesToUpload.find((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024);
    if (invalidFile) {
      setSubmitError('Usa immagini JPG, PNG o WebP di massimo 5 MB.');
      return;
    }

    setSubmitError(null);
    setIsUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitError('La sessione è scaduta. Accedi di nuovo prima di caricare immagini.');
      setIsUploading(false);
      return;
    }

    try {
      const uploadedUrls = await Promise.all(filesToUpload.map(async (file) => {
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from('product-images').upload(path, file, { cacheControl: '31536000', contentType: file.type, upsert: false });
        if (error) throw error;
        return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
      }));
      const nextImages = [...imageUrls, ...uploadedUrls];
      setImageUrls(nextImages);
      setValue('images', nextImages, { shouldValidate: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? `Caricamento non riuscito: ${error.message}` : 'Caricamento immagini non riuscito.');
    } finally {
      setIsUploading(false);
    }
  }

  function removeImage(imageUrl: string) {
    const nextImages = imageUrls.filter((url) => url !== imageUrl);
    setImageUrls(nextImages);
    setValue('images', nextImages, { shouldValidate: true });
  }

  function toggleShippingOption(option: 'standard' | 'express' | 'pickup') {
    const nextOptions = shippingOptions.includes(option) ? shippingOptions.filter((value) => value !== option) : [...shippingOptions, option];
    setValue('shippingOptions', nextOptions, { shouldValidate: true });
  }

  async function onSubmit(values: CreateProductInput) {
    setSubmitError(null);
    setIsSubmitting(true);
    const result = await createProduct({ ...values, images: imageUrls });
    setIsSubmitting(false);
    if (!result.success) {
      setSubmitError(result.error);
      return;
    }
    router.push(`/products/${result.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div><h2 className="text-lg font-bold">Foto</h2><p className="mt-1 text-sm text-muted-foreground">La prima foto sarà la copertina. Carica fino a 8 immagini.</p></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {imageUrls.map((url, index) => <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-border"><Image src={url} alt={`Anteprima foto ${index + 1}`} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" /><span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold">{index === 0 ? 'Copertina' : index + 1}</span><button type="button" onClick={() => removeImage(url)} aria-label={`Rimuovi foto ${index + 1}`} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-foreground text-background opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"><Trash2 className="h-4 w-4" aria-hidden="true" /></button></div>)}
          {imageUrls.length < 8 && <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/50 text-center text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-primary"><ImagePlus className="h-7 w-7" aria-hidden="true" /><span>{isUploading ? 'Caricamento...' : 'Aggiungi foto'}</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={isUploading} onChange={(event) => { void uploadFiles(event.target.files); event.currentTarget.value = ''; }} /></label>}
        </div>
        {errors.images && <p className="text-sm text-destructive">{errors.images.message}</p>}
      </section>

      <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div><h2 className="text-lg font-bold">Dettagli dell’articolo</h2><p className="mt-1 text-sm text-muted-foreground">Descrizioni precise aiutano a vendere più velocemente.</p></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Titolo" error={errors.title?.message} className="sm:col-span-2"><Input {...register('title')} placeholder="Es. Giacca di jeans oversize" maxLength={120} /></Field>
          <Field label="Categoria" error={errors.categoryId?.message}><select {...register('categoryId')} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"><option value="">Seleziona una categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
          <Field label="Taglia" error={errors.size?.message}><Input {...register('size')} placeholder="Es. M, 38, 42" maxLength={32} /></Field>
          <Field label="Brand" error={errors.brand?.message}><Input {...register('brand')} placeholder="Es. Levi's" maxLength={80} /></Field>
          <Field label="Colore" error={errors.color?.message}><Input {...register('color')} placeholder="Es. Blu" maxLength={50} /></Field>
          <Field label="Condizioni" error={errors.condition?.message} className="sm:col-span-2"><select {...register('condition')} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">{conditions.map((condition) => <option key={condition.value} value={condition.value}>{condition.label}</option>)}</select></Field>
          <Field label="Descrizione" error={errors.description?.message} className="sm:col-span-2"><textarea {...register('description')} rows={6} maxLength={5000} placeholder="Racconta il fit, il materiale, eventuali difetti e perché lo ami." className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" /></Field>
        </div>
      </section>

      <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div><h2 className="text-lg font-bold">Prezzo e consegna</h2><p className="mt-1 text-sm text-muted-foreground">Il prezzo è mostrato in euro.</p></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Prezzo" error={errors.price?.message}><div className="relative"><Input {...register('price')} type="number" min="0.01" max="1000000" step="0.01" inputMode="decimal" className="pr-12" /><span className="pointer-events-none absolute right-3 top-2.5 text-sm text-muted-foreground">EUR</span></div></Field>
          <fieldset><legend className="mb-2 block text-sm font-semibold">Opzioni di spedizione</legend><div className="flex flex-wrap gap-2">{(['standard', 'express', 'pickup'] as const).map((option) => <label key={option} className="cursor-pointer"><input type="checkbox" checked={shippingOptions.includes(option)} onChange={() => toggleShippingOption(option)} className="peer sr-only" /><span className="inline-flex h-10 items-center rounded-full border border-input px-3 text-sm font-medium capitalize transition peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground">{option === 'pickup' ? 'Ritiro a mano' : option}</span></label>)}</div>{errors.shippingOptions && <p className="mt-2 text-sm text-destructive">{errors.shippingOptions.message}</p>}</fieldset>
        </div>
      </section>

      {submitError && <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{submitError}</p>}
      <div className="flex justify-end"><Button type="submit" size="lg" disabled={isSubmitting || isUploading} className="min-w-44 gap-2">{isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UploadCloud className="h-4 w-4" aria-hidden="true" />}{isSubmitting ? 'Pubblicazione...' : 'Pubblica articolo'}</Button></div>
    </form>
  );
}

function Field({ label, error, children, className = '' }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return <div className={className}><label className="mb-2 block text-sm font-semibold">{label}</label>{children}{error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}</div>;
}
