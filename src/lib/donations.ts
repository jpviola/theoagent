import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ==============================================
// TIPOS DE TYPESCRIPT
// ==============================================

export type PaymentProvider = 'stripe' | 'paypal' | 'mercadopago'

export type DonationStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'

export interface Donation {
  id: string
  user_id?: string | null
  payment_provider: PaymentProvider
  payment_id: string
  session_id?: string | null
  amount_cents: number
  currency: string
  status: DonationStatus
  donor_email?: string | null
  donor_name?: string | null
  message?: string | null
  is_anonymous: boolean
  metadata: Record<string, unknown>
  webhook_verified: boolean
  created_at: string
  updated_at: string
  completed_at?: string | null
}

export interface CreateDonationData {
  user_id?: string
  payment_provider: PaymentProvider
  payment_id: string
  session_id?: string
  amount_cents: number
  currency?: string
  donor_email?: string
  donor_name?: string
  message?: string
  is_anonymous?: boolean
  metadata?: Record<string, unknown>
}

export interface DonationStats {
  total_donations: number
  total_amount_cents: number
  completed_donations: number
  stripe_donations: number
  paypal_donations: number
  average_amount_cents: number
}

// ==============================================
// FUNCIONES DE BASE DE DATOS
// ==============================================

/**
 * Crear una nueva donación
 */
export async function createDonation(data: CreateDonationData): Promise<{ data: Donation | null; error: unknown }> {
  try {
    const donationData = {
      user_id: data.user_id || null,
      payment_provider: data.payment_provider,
      payment_id: data.payment_id,
      session_id: data.session_id || null,
      amount_cents: data.amount_cents,
      currency: data.currency || 'usd',
      status: 'pending' as DonationStatus,
      donor_email: data.donor_email || null,
      donor_name: data.donor_name || null,
      message: data.message || null,
      is_anonymous: data.is_anonymous || false,
      metadata: data.metadata || {},
      webhook_verified: false
    }

    const { data: donation, error } = await supabaseAdmin
      .from('donations')
      .insert(donationData)
      .select()
      .single()

    return { data: donation, error }
  } catch (error) {
    console.error('Error creating donation:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar el status de una donación
 */
export async function updateDonationStatus(
  payment_provider: PaymentProvider,
  payment_id: string,
  status: DonationStatus,
  webhook_verified: boolean = false,
  metadata: Record<string, unknown> = {}
): Promise<{ data: Donation | null; error: unknown }> {
  try {
    const updateData: Partial<Donation> & {
      status: DonationStatus
      webhook_verified: boolean
      metadata: Record<string, unknown>
      updated_at: string
    } = {
      status,
      webhook_verified,
      metadata,
      updated_at: new Date().toISOString()
    }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('donations')
      .update(updateData)
      .eq('payment_provider', payment_provider)
      .eq('payment_id', payment_id)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error updating donation status:', error)
    return { data: null, error }
  }
}

/**
 * Obtener una donación por provider y payment_id
 */
export async function getDonationByPaymentId(
  payment_provider: PaymentProvider,
  payment_id: string
): Promise<{ data: Donation | null; error: unknown }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('donations')
      .select('*')
      .eq('payment_provider', payment_provider)
      .eq('payment_id', payment_id)
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error getting donation:', error)
    return { data: null, error }
  }
}

/**
 * Obtener todas las donaciones de un usuario
 */
export async function getUserDonations(user_id: string): Promise<{ data: Donation[] | null; error: unknown }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('donations')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    return { data, error }
  } catch (error) {
    console.error('Error getting user donations:', error)
    return { data: null, error }
  }
}

/**
 * Obtener estadísticas generales de donaciones
 */
export async function getDonationStats(): Promise<{ data: DonationStats | null; error: unknown }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('donations')
      .select('payment_provider, status, amount_cents')

    if (error || !data) {
      return { data: null, error }
    }

    const stats: DonationStats = {
      total_donations: data.length,
      total_amount_cents: data.reduce((sum, d) => sum + d.amount_cents, 0),
      completed_donations: data.filter(d => d.status === 'completed').length,
      stripe_donations: data.filter(d => d.payment_provider === 'stripe').length,
      paypal_donations: data.filter(d => d.payment_provider === 'paypal').length,
      average_amount_cents: data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.amount_cents, 0) / data.length) : 0
    }

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error getting donation stats:', error)
    return { data: null, error }
  }
}

/**
 * Obtener donaciones recientes (últimos 30 días)
 */
export async function getRecentDonations(limit: number = 10): Promise<{ data: Donation[] | null; error: unknown }> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data, error } = await supabaseAdmin
      .from('donations')
      .select('*')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)

    return { data, error }
  } catch (error) {
    console.error('Error getting recent donations:', error)
    return { data: null, error }
  }
}

/**
 * Verificar si existe una donación
 */
export async function donationExists(
  payment_provider: PaymentProvider,
  payment_id: string
): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('donations')
      .select('id')
      .eq('payment_provider', payment_provider)
      .eq('payment_id', payment_id)
      .single()

    return !!data && !error
  } catch {
    return false
  }
}

// ==============================================
// FUNCIONES UTILITARIAS
// ==============================================

/**
 * Formatear cantidad en centavos a dólares
 */
export function formatCentsToDollars(cents: number): string {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  })
}

/**
 * Convertir dólares a centavos
 */
export function dollarsToTents(dollars: number): number {
  return Math.round(dollars * 100)
}

/**
 * Obtener color para el status de donación
 */
export function getStatusColor(status: DonationStatus): string {
  const colors = {
    pending: '#f59e0b',    // amber-500
    completed: '#10b981',  // emerald-500
    failed: '#ef4444',     // red-500
    refunded: '#6b7280',   // gray-500
    cancelled: '#6b7280'   // gray-500
  }
  return colors[status] || '#6b7280'
}

/**
 * Obtener texto legible para el status
 */
export function getStatusText(status: DonationStatus): string {
  const texts = {
    pending: 'Pendiente',
    completed: 'Completado',
    failed: 'Fallido',
    refunded: 'Reembolsado',
    cancelled: 'Cancelado'
  }
  return texts[status] || status
}
