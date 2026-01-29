-- Migration: Add 'mercadopago' to valid payment providers

-- Drop the existing constraint
ALTER TABLE public.donations 
DROP CONSTRAINT IF EXISTS donations_payment_provider_check;

-- Add the new constraint including 'mercadopago'
ALTER TABLE public.donations 
ADD CONSTRAINT donations_payment_provider_check 
CHECK (payment_provider IN ('paypal', 'mercadopago'));
