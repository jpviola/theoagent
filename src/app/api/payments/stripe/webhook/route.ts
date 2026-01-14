import Stripe from 'stripe'

const stripeSecret = process.env.STRIPE_SECRET_KEY || ''
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2025-12-15.clover' }) : null

export async function POST(req: Request) {
  if (!stripe || !stripeWebhookSecret) {
    return new Response(JSON.stringify({ error: 'Stripe or webhook secret not configured.' }), { status: 501 })
  }

  const payload = await req.text()
  const sig = req.headers.get('stripe-signature') || ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, sig, stripeWebhookSecret)
  } catch (err: any) {
    return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Stripe: checkout.session.completed', session.id)
        // TODO: mark order as paid in DB, trigger fulfillment, send receipt
        break
      }
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        console.log('Stripe: payment_intent.succeeded', pi.id)
        break
      }
      default:
        console.log('Stripe: unhandled event', event.type)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500 })
  }
}

export async function GET() {
  return new Response(JSON.stringify({ status: 'ok', webhook: 'stripe' }), { status: 200 })
}
