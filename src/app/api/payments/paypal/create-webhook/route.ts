async function getAccessToken() {
  const client = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_SECRET
  if (!client || !secret) return null

  const base = process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'
  const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${client}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!tokenRes.ok) return null
  const data = await tokenRes.json()
  return { token: data.access_token, base }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const webhookUrl = body.webhookUrl || body.url || `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/payments/paypal/webhook`
  const events = Array.isArray(body.events) && body.events.length > 0 ? body.events : [
    'CHECKOUT.ORDER.APPROVED',
    'PAYMENT.CAPTURE.COMPLETED',
    'PAYMENT.CAPTURE.DENIED',
    'PAYMENT.CAPTURE.REFUNDED',
  ]

  const tokenInfo = await getAccessToken()
  if (!tokenInfo) {
    return new Response(JSON.stringify({ error: 'PayPal credentials not configured (PAYPAL_CLIENT_ID/PAYPAL_SECRET)' }), { status: 501 })
  }

  try {
    // Check existing webhooks
    const listRes = await fetch(`${tokenInfo.base}/v1/notifications/webhooks`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenInfo.token}` },
    })

    if (listRes.ok) {
      const listData = await listRes.json()
      const found = Array.isArray(listData.webhooks) ? listData.webhooks.find((w: any) => w.url === webhookUrl) : null
      if (found) return new Response(JSON.stringify({ webhook: found, existed: true }), { status: 200 })
    }

    const createBody = {
      url: webhookUrl,
      event_types: events.map((name: string) => ({ name })),
    }

    const createRes = await fetch(`${tokenInfo.base}/v1/notifications/webhooks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenInfo.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createBody),
    })

    const created = await createRes.json()
    if (!createRes.ok) return new Response(JSON.stringify({ error: created }), { status: 500 })

    return new Response(JSON.stringify({ webhook: created, existed: false }), { status: 201 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500 })
  }
}

export async function GET() {
  return new Response(JSON.stringify({ status: 'ok', action: 'create-paypal-webhook' }), { status: 200 })
}
