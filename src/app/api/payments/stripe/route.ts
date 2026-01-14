import Stripe from 'stripe'
import { createDonation } from '@/lib/donations'

const stripeSecret = process.env.STRIPE_SECRET_KEY || ''
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2025-12-15.clover' }) : null

export async function POST(req: Request) {
  if (!stripe) {
    return new Response(JSON.stringify({ error: 'Stripe not configured. Set STRIPE_SECRET_KEY.' }), { status: 501 })
  }

  try {
    const body = await req.json()
    const { amount = 500, currency = 'usd', success_url, cancel_url, donor_email, donor_name, message, user_id } = body

    // Crear sesión de checkout en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: 'Donación a SantaPalabra' },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: success_url || `${process.env.NEXT_PUBLIC_BASE_URL || ''}/support?status=success`,
      cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_BASE_URL || ''}/support?status=cancel`,
      customer_email: donor_email,
      metadata: {
        donor_name: donor_name || '',
        message: message || '',
        user_id: user_id || '',
        source: 'santapalabra_donation'
      }
    })

    // Guardar donación en base de datos con status "pending"
    const { data: donation, error: dbError } = await createDonation({
      user_id: user_id,
      payment_provider: 'stripe',
      payment_id: session.payment_intent as string || session.id,
      session_id: session.id,
      amount_cents: amount,
      currency: currency,
      donor_email: donor_email,
      donor_name: donor_name,
      message: message,
      metadata: {
        session_url: session.url,
        stripe_session_id: session.id,
        created_via: 'api_request'
      }
    })

    if (dbError) {
      console.warn('Warning: Failed to save donation to database:', dbError)
      // No fallar la respuesta por esto, el webhook puede intentar de nuevo
    }

    console.log('💳 Stripe session created:', { 
      session_id: session.id, 
      amount, 
      donation_saved: !dbError 
    })

    return new Response(JSON.stringify({ url: session.url }), { status: 200 })
  } catch (err: any) {
    console.error('❌ Stripe error:', err)
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500 })
  }
}

export async function GET() {
  return new Response(JSON.stringify({ status: 'ok', provider: 'stripe' }), { status: 200 })
}
