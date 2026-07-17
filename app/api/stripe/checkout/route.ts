import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const checkoutSchema = z.object({ productId: z.string().uuid() });

export async function POST(request: Request) {
  const requestBody = await request.json().catch(() => null);
  const parsedBody = checkoutSchema.safeParse(requestBody);
  if (!parsedBody.success) return NextResponse.json({ error: 'Articolo non valido.' }, { status: 400 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Devi accedere per acquistare.' }, { status: 401 });

  const { data: product, error: productError } = await supabase.from('products').select('*').eq('id', parsedBody.data.productId).maybeSingle();
  if (productError || !product || product.status !== 'active') return NextResponse.json({ error: 'Questo articolo non è più disponibile.' }, { status: 409 });
  if (product.seller_id === user.id) return NextResponse.json({ error: 'Non puoi acquistare un tuo articolo.' }, { status: 400 });

  const admin = createAdminClient();
  const { data: existingOrder } = await admin.from('orders').select('id').eq('product_id', product.id).in('status', ['pending', 'paid', 'shipped', 'delivered']).maybeSingle();
  if (existingOrder) return NextResponse.json({ error: 'Questo articolo è già in fase di acquisto.' }, { status: 409 });

  const { data: order, error: orderError } = await admin.from('orders').insert({ product_id: product.id, buyer_id: user.id, seller_id: product.seller_id, amount_cents: product.price_cents, currency: product.currency, status: 'pending', shipping_address: null }).select().single();
  if (orderError || !order) return NextResponse.json({ error: 'Non è stato possibile creare l’ordine.' }, { status: 500 });

  if (process.env.PAYMENT_PROVIDER !== 'stripe') {
    const { error: demoOrderError } = await admin.from('orders').update({ status: 'paid' }).eq('id', order.id);
    if (demoOrderError) return NextResponse.json({ error: 'Non è stato possibile confermare l’ordine di test.' }, { status: 500 });
    await admin.from('products').update({ status: 'reserved' }).eq('id', product.id).eq('status', 'active');
    return NextResponse.json({ url: `${process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin}/orders/${order.id}?checkout=demo` });
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      line_items: [{ price_data: { currency: product.currency.toLowerCase(), product_data: { name: product.title, images: product.image_urls.slice(0, 1), metadata: { product_id: product.id } }, unit_amount: product.price_cents }, quantity: 1 }],
      metadata: { order_id: order.id, product_id: product.id },
      success_url: `${appUrl}/orders/${order.id}?checkout=success`,
      cancel_url: `${appUrl}/products/${product.id}?checkout=cancelled`,
      shipping_address_collection: { allowed_countries: ['IT', 'AT', 'BE', 'DE', 'ES', 'FR', 'NL', 'PT'] }
    });
    if (!session.url) throw new Error('Stripe did not return a checkout URL.');
    const { error: updateError } = await admin.from('orders').update({ stripe_checkout_session_id: session.id }).eq('id', order.id);
    if (updateError) throw updateError;
    return NextResponse.json({ url: session.url });
  } catch (error) {
    await admin.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Non è stato possibile avviare il pagamento.' }, { status: 502 });
  }
}
