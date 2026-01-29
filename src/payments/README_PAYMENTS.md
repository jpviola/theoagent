# Pagos — SantaPalabra

Variables de entorno necesarias (agregar en `.env.local` y en Vercel):

- `PAYPAL_CLIENT_ID` — PayPal client id (sandbox o live)
- `PAYPAL_SECRET` — PayPal secret
- `PAYPAL_ENV` — `sandbox` o `live` (por defecto `sandbox` si no existe)
- `MERCADOPAGO_ACCESS_TOKEN` — Access token de MercadoPago
- `NEXT_PUBLIC_BASE_URL` — URL pública de la app (ej. https://santapalabra.app)

Endpoints añadidos:

- `POST /api/payments/paypal` — crea una orden PayPal y devuelve `approveUrl` para redirigir al comprador.
- `POST /api/payments/paypal/capture` — captura la orden (pasar `{ orderId }`).
- `POST /api/payments/paypal/webhook` — webhook stub (validación pendiente — ver notas).
- `POST /api/payments/mercadopago` — crea una preferencia de pago en MercadoPago.
