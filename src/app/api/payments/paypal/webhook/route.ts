type PayPalWebhookEvent = {
  event_type?: string
  [key: string]: unknown
}

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
  const ackHeaders = {
    transmissionId: req.headers.get('paypal-transmission-id') || req.headers.get('Paypal-Transmission-Id') || '',
    transmissionTime: req.headers.get('paypal-transmission-time') || req.headers.get('Paypal-Transmission-Time') || '',
    certUrl: req.headers.get('paypal-cert-url') || req.headers.get('Paypal-Cert-Url') || '',
    authAlgo: req.headers.get('paypal-auth-algo') || req.headers.get('Paypal-Auth-Algo') || '',
    transmissionSig: req.headers.get('paypal-transmission-sig') || req.headers.get('Paypal-Transmission-Sig') || '',
  }

  const webhookId = process.env.PAYPAL_WEBHOOK_ID || ''
  if (!webhookId) {
    return new Response(JSON.stringify({ error: 'PAYPAL_WEBHOOK_ID not configured' }), { status: 501 })
  }

  const tokenInfo = await getAccessToken()
  if (!tokenInfo) {
    return new Response(JSON.stringify({ error: 'PayPal credentials not configured' }), { status: 501 })
  }

  try {
    const payloadText = await req.text()
    let webhookEvent: PayPalWebhookEvent
    try {
      webhookEvent = JSON.parse(payloadText) as PayPalWebhookEvent
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400 })
    }

    const verifyBody = {
      auth_algo: ackHeaders.authAlgo,
      cert_url: ackHeaders.certUrl,
      transmission_id: ackHeaders.transmissionId,
      transmission_sig: ackHeaders.transmissionSig,
      transmission_time: ackHeaders.transmissionTime,
      webhook_id: webhookId,
      webhook_event: webhookEvent,
    }

    const verifyRes = await fetch(`${tokenInfo.base}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenInfo.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verifyBody),
    })

    const verifyData = await verifyRes.json()
    if (!verifyRes.ok || verifyData.verification_status !== 'SUCCESS') {
      console.warn('PayPal webhook verification failed', { verifyData })
      return new Response(JSON.stringify({ error: 'Webhook verification failed', details: verifyData }), { status: 400 })
    }

    // Verified — process event
    const eventType = webhookEvent.event_type
    switch (eventType) {
      case 'CHECKOUT.ORDER.APPROVED':
        console.log('PayPal: order approved', webhookEvent)
        break
      case 'PAYMENT.CAPTURE.COMPLETED':
        console.log('PayPal: payment captured', webhookEvent)
        break
      default:
        console.log('PayPal: unhandled event', eventType)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}

export async function GET() {
  return new Response(JSON.stringify({ status: 'ok', webhook: 'paypal' }), { status: 200 })
}
