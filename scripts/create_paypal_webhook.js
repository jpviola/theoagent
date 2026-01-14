#!/usr/bin/env node
/*
Creates a PayPal webhook programmatically. Requires env vars:
PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_ENV (sandbox|live), NEXT_PUBLIC_BASE_URL

Usage:
  node scripts/create_paypal_webhook.js
  node scripts/create_paypal_webhook.js --url=https://example.com/api/payments/paypal/webhook --save
*/

async function getAccessToken() {
  const client = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_SECRET
  if (!client || !secret) {
    throw new Error('PAYPAL_CLIENT_ID and PAYPAL_SECRET must be set')
  }
  const base = process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${client}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Failed to fetch token: ${res.status} ${txt}`)
  }

  const data = await res.json()
  return { token: data.access_token, base }
}

async function run() {
  const argv = Object.fromEntries(process.argv.slice(2).map(a => {
    const [k,v] = a.split('=')
    return [k.replace(/^--/,''), v || true]
  }))

  const webhookUrl = argv.url || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payments/paypal/webhook`
  const save = argv.save
  const events = ['CHECKOUT.ORDER.APPROVED','PAYMENT.CAPTURE.COMPLETED','PAYMENT.CAPTURE.DENIED','PAYMENT.CAPTURE.REFUNDED']

  const tokenInfo = await getAccessToken()

  // list existing
  const list = await fetch(`${tokenInfo.base}/v1/notifications/webhooks`, {
    method: 'GET', headers: { Authorization: `Bearer ${tokenInfo.token}` }
  })
  if (!list.ok) {
    const txt = await list.text()
    throw new Error('Failed to list webhooks: ' + txt)
  }
  const listData = await list.json()
  const found = Array.isArray(listData.webhooks) ? listData.webhooks.find(w => w.url === webhookUrl) : null
  if (found) {
    console.log('Webhook already exists:')
    console.log(JSON.stringify(found, null, 2))
    if (save) {
      console.log('Saving PAYPAL_WEBHOOK_ID to .env.local')
      const fs = await import('fs')
      const line = `PAYPAL_WEBHOOK_ID=${found.id}\n`
      try { fs.appendFileSync('.env.local', line) } catch (e) { console.warn('Failed to write .env.local', e) }
    }
    return
  }

  const createBody = { url: webhookUrl, event_types: events.map(n => ({ name: n })) }
  const createRes = await fetch(`${tokenInfo.base}/v1/notifications/webhooks`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenInfo.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(createBody),
  })

  const created = await createRes.json()
  if (!createRes.ok) {
    throw new Error('Failed to create webhook: ' + JSON.stringify(created))
  }

  console.log('Created webhook:')
  console.log(JSON.stringify(created, null, 2))

  if (save && created.id) {
    const fs = await import('fs')
    const line = `PAYPAL_WEBHOOK_ID=${created.id}\n`
    try { fs.appendFileSync('.env.local', line) } catch (e) { console.warn('Failed to write .env.local', e) }
    console.log('Saved PAYPAL_WEBHOOK_ID to .env.local')
  }
}

run().catch(err => { console.error(err); process.exit(1) })
