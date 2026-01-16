type PayPalOrderLink = {
  rel?: string
  href?: string
}

async function getAccessToken() {
  const client = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_SECRET
  if (!client || !secret) return null

  const tokenRes = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${client}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!tokenRes.ok) return null
  const data = await tokenRes.json()
  return data.access_token
}

export async function POST(req: Request) {
  const token = await getAccessToken()
  if (!token) {
    return new Response(JSON.stringify({ error: 'PayPal not configured. Set PAYPAL_CLIENT_ID and PAYPAL_SECRET.' }), { status: 501 })
  }

  try {
    const body = await req.json()
    const { amount = '5.00', currency = 'USD' } = body
    const base = process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'
    const returnUrl = body.return_url || `${process.env.NEXT_PUBLIC_BASE_URL || ''}/support?status=paypal_success`
    const cancelUrl = body.cancel_url || `${process.env.NEXT_PUBLIC_BASE_URL || ''}/support?status=paypal_cancel`

    const orderRes = await fetch(`${base}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        application_context: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
        purchase_units: [
          {
            amount: { currency_code: currency, value: amount },
            description: 'Donación a SantaPalabra',
          },
        ],
      }),
    })

    const data = await orderRes.json()
    if (!orderRes.ok) return new Response(JSON.stringify({ error: data }), { status: 500 })

    const links = Array.isArray(data.links) ? (data.links as PayPalOrderLink[]) : []
    const approve = links.find((l) => l.rel === 'approve')?.href
    return new Response(JSON.stringify({ 
      order: data, 
      orderId: data.id,  // Ensure we always return orderId
      approveUrl: approve 
    }), { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}

export async function GET() {
  return new Response(JSON.stringify({ status: 'ok', provider: 'paypal' }), { status: 200 })
}
