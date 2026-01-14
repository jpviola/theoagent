import { headers } from 'next/headers'
import Stripe from 'stripe'
import { updateDonationStatus, getDonationByPaymentId } from '@/lib/donations'

const stripeSecret = process.env.STRIPE_SECRET_KEY || ''
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2025-12-15.clover' }) : null

export async function POST(req: Request) {
  if (!stripe || !webhookSecret) {
    console.error('❌ Stripe webhook: Missing configuration')
    return new Response(JSON.stringify({ error: 'Webhook not configured' }), { status: 501 })
  }

  try {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('❌ Stripe webhook: No signature')
      return new Response(JSON.stringify({ error: 'No signature' }), { status: 400 })
    }

    // Verificar el webhook
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log('📥 Stripe webhook received:', event.type)

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'invoice.payment_succeeded':
        // Para suscripciones futuras
        console.log('📄 Invoice payment succeeded')
        break

      default:
        console.log(`🤷‍♂️ Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err: any) {
    console.error('❌ Stripe webhook error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('✅ Checkout completed:', session.id)

    // Actualizar donación en base de datos
    const { error } = await updateDonationStatus(
      'stripe',
      session.payment_intent as string || session.id,
      'completed',
      true, // webhook_verified = true
      {
        stripe_session: session,
        completed_via: 'webhook_checkout_completed',
        customer_email: session.customer_details?.email,
        amount_total: session.amount_total,
        updated_at: new Date().toISOString()
      }
    )

    if (error) {
      console.error('❌ Failed to update donation status:', error)
    } else {
      console.log('✅ Donation marked as completed')
    }
  } catch (error) {
    console.error('❌ Error handling checkout completed:', error)
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('💰 Payment succeeded:', paymentIntent.id)

    const { error } = await updateDonationStatus(
      'stripe',
      paymentIntent.id,
      'completed',
      true,
      {
        stripe_payment_intent: paymentIntent,
        completed_via: 'webhook_payment_succeeded',
        amount_received: paymentIntent.amount_received,
        updated_at: new Date().toISOString()
      }
    )

    if (error) {
      console.error('❌ Failed to update payment status:', error)
    }
  } catch (error) {
    console.error('❌ Error handling payment succeeded:', error)
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('❌ Payment failed:', paymentIntent.id)

    const { error } = await updateDonationStatus(
      'stripe',
      paymentIntent.id,
      'failed',
      true,
      {
        stripe_payment_intent: paymentIntent,
        failure_reason: paymentIntent.last_payment_error?.message || 'Unknown error',
        failed_via: 'webhook_payment_failed',
        updated_at: new Date().toISOString()
      }
    )

    if (error) {
      console.error('❌ Failed to update payment failure status:', error)
    }
  } catch (error) {
    console.error('❌ Error handling payment failed:', error)
  }
}

export async function GET() {
  return new Response(JSON.stringify({ 
    status: 'ok', 
    provider: 'stripe',
    webhook: 'active',
    configured: !!stripe && !!webhookSecret
  }), { status: 200 })
}