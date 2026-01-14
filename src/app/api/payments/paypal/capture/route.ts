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
    const { orderId } = await req.json()
    if (!orderId) return new Response(JSON.stringify({ error: 'orderId is required' }), { status: 400 })

    const base = process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

    const capRes = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await capRes.json()
    if (!capRes.ok) return new Response(JSON.stringify({ error: data }), { status: 500 })

    return new Response(JSON.stringify({ capture: data }), { status: 200 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500 })
  }
}

export async function GET() {
  return new Response(JSON.stringify({ status: 'ok', provider: 'paypal-capture' }), { status: 200 })
}
