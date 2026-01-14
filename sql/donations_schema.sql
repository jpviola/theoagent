-- ==============================================
-- TABLA DONATIONS - Para almacenar todas las donaciones
-- ==============================================

CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payment_provider VARCHAR(20) NOT NULL CHECK (payment_provider IN ('stripe', 'paypal')),
  payment_id VARCHAR(255) NOT NULL, -- ID de la transacción desde el proveedor
  session_id VARCHAR(255), -- ID de sesión (para Stripe)
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  donor_email VARCHAR(255),
  donor_name VARCHAR(255),
  message TEXT, -- Mensaje opcional del donante
  is_anonymous BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}', -- Datos adicionales del proveedor
  webhook_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Índices para consultas eficientes
  CONSTRAINT unique_payment_provider_id UNIQUE (payment_provider, payment_id)
);

-- ==============================================
-- ÍNDICES PARA PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_provider ON donations(payment_provider);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_amount ON donations(amount_cents DESC);

-- ==============================================
-- TRIGGER PARA UPDATED_AT
-- ==============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_donations_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- RLS (ROW LEVEL SECURITY) - Opcional
-- ==============================================

-- Habilitar RLS (descomentar si se necesita)
-- ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios vean solo sus propias donaciones
-- CREATE POLICY "Users can view own donations"
--   ON donations FOR SELECT
--   USING (auth.uid() = user_id);

-- Política para insertar (allow all para webhooks)
-- CREATE POLICY "Allow donations insert"
--   ON donations FOR INSERT
--   WITH CHECK (true);

-- ==============================================
-- VISTA PARA ESTADÍSTICAS DE DONACIONES
-- ==============================================

CREATE OR REPLACE VIEW donation_stats AS
SELECT 
  payment_provider,
  status,
  currency,
  COUNT(*) as transaction_count,
  SUM(amount_cents) as total_cents,
  AVG(amount_cents) as average_cents,
  MIN(amount_cents) as min_cents,
  MAX(amount_cents) as max_cents,
  DATE_TRUNC('day', created_at) as day
FROM donations
GROUP BY payment_provider, status, currency, DATE_TRUNC('day', created_at)
ORDER BY day DESC;

-- ==============================================
-- FUNCIÓN PARA OBTENER ESTADÍSTICAS MENSUALES
-- ==============================================

CREATE OR REPLACE FUNCTION get_monthly_donation_stats(months_back INTEGER DEFAULT 12)
RETURNS TABLE (
  month DATE,
  total_donations BIGINT,
  total_amount_cents BIGINT,
  stripe_count BIGINT,
  paypal_count BIGINT,
  completed_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE_TRUNC('month', d.created_at)::DATE as month,
    COUNT(*)::BIGINT as total_donations,
    SUM(d.amount_cents)::BIGINT as total_amount_cents,
    COUNT(CASE WHEN d.payment_provider = 'stripe' THEN 1 END)::BIGINT as stripe_count,
    COUNT(CASE WHEN d.payment_provider = 'paypal' THEN 1 END)::BIGINT as paypal_count,
    COUNT(CASE WHEN d.status = 'completed' THEN 1 END)::BIGINT as completed_count
  FROM donations d
  WHERE d.created_at >= NOW() - INTERVAL '1 month' * months_back
  GROUP BY DATE_TRUNC('month', d.created_at)
  ORDER BY month DESC;
END;
$$ LANGUAGE plpgsql;