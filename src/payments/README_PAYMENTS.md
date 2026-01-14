# Pagos — SantaPalabra

Variables de entorno necesarias (agregar en `.env.local` y en Vercel):

- `STRIPE_SECRET_KEY` — clave secreta de Stripe (test/live según entorno)
- `STRIPE_WEBHOOK_SECRET` — secret del webhook configurado en el dashboard de Stripe
- `PAYPAL_CLIENT_ID` — PayPal client id (sandbox o live)
- `PAYPAL_SECRET` — PayPal secret
- `PAYPAL_ENV` — `sandbox` o `live` (por defecto `sandbox` si no existe)
- `NEXT_PUBLIC_BASE_URL` — URL pública de la app (ej. https://santapalabra.app)

Endpoints añadidos:

- `POST /api/payments/stripe` — crea una sesión de Checkout (ya creado). Envía `amount`, `currency`, `success_url`, `cancel_url`.
- `GET /api/payments/stripe/webhook` — health
- `POST /api/payments/stripe/webhook` — recibe webhooks y verifica firma usando `STRIPE_WEBHOOK_SECRET`.
- `POST /api/payments/paypal` — crea una orden PayPal y devuelve `approveUrl` para redirigir al comprador.
- `POST /api/payments/paypal/capture` — captura la orden (pasar `{ orderId }`).
- `POST /api/payments/paypal/webhook` — webhook stub (validación pendiente — ver notas).

Pruebas locales (ejemplos):

1) Stripe: crear sesión (requiere `STRIPE_SECRET_KEY` y `NEXT_PUBLIC_BASE_URL`):

```bash
curl -X POST http://localhost:3000/api/payments/stripe \
  -H "Content-Type: application/json" \
  -d '{"amount":500, "currency":"usd"}'
```

La respuesta incluirá `url` para redirigir al checkout de Stripe.

2) PayPal: crear orden y obtener approval link (requiere `PAYPAL_CLIENT_ID` y `PAYPAL_SECRET`):

```bash
curl -X POST http://localhost:3000/api/payments/paypal \
  -H "Content-Type: application/json" \
  -d '{"amount":"5.00","currency":"USD"}'
```

La respuesta contiene `approveUrl` donde redirigir al comprador. Tras la aprobación, captura la orden con:

```bash
curl -X POST http://localhost:3000/api/payments/paypal/capture \
  -H "Content-Type: application/json" \
  -d '{"orderId":"REPLACE_WITH_ORDER_ID"}'
```

Notas de seguridad y siguientes pasos:

- Registrar webhooks en Stripe y PayPal y establecer `STRIPE_WEBHOOK_SECRET` y el `webhook_id` de PayPal si se implementa verificación completa.
- Implementar almacenamiento en base de datos para registrar pagos y evitar fulfilment duplicado.
- Asegurarse de usar claves de test en desarrollo y claves live en producción.

Automatizar registro del webhook de PayPal:

- Hemos añadido un endpoint que registra programáticamente un webhook en PayPal: `POST /api/payments/paypal/create-webhook`.
- Payload ejemplo:

```bash
curl -X POST http://localhost:3000/api/payments/paypal/create-webhook \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl":"https://example.com/api/payments/paypal/webhook","events":["CHECKOUT.ORDER.APPROVED","PAYMENT.CAPTURE.COMPLETED"]}'
```

- Si el webhook ya existe, se devuelve el objeto existente con `existed: true`.
- Requiere `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_ENV` y que la URL sea accesible desde PayPal (usa ngrok para pruebas locales).

Ejecutar el script local o en CI/CD:

```bash
# local (usa .env.local)
npm run create-paypal-webhook -- --url=https://your-public-url/api/payments/paypal/webhook --save

# en CI: asegúrate de que las variables de entorno estén disponibles y ejecuta:
npm run create-paypal-webhook -- --url=https://your-domain/api/payments/paypal/webhook
```

El flag `--save` añadirá `PAYPAL_WEBHOOK_ID` a `.env.local` cuando el webhook sea creado o si ya existe.
