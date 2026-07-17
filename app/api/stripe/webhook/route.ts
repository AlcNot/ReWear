import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) return NextResponse.json({ error: 'Webhook signature configuration is missing.' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid webhook signature.' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    if (orderId) {
      const admin = createAdminClient();
      await admin.from('orders').update({ status: 'paid', stripe_checkout_session_id: session.id, stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null, shipping_address: (session.shipping_details?.address as Record<string, unknown> | undefined) ?? null }).eq('id', orderId);
      const productId = session.metadata?.product_id;
      if (productId) await admin.from('products').update({ status: 'reserved' }).eq('id', productId).eq('status', 'active');
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    if (orderId) await createAdminClient().from('orders').update({ status: 'cancelled' }).eq('id', orderId).eq('status', 'pending');
  }

  return NextResponse.json({ received: true });
}
