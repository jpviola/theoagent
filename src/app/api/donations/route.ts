import { NextRequest } from 'next/server'
import { getDonationStats, getRecentDonations, getUserDonations } from '@/lib/donations'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'stats'
  const userId = searchParams.get('user_id')
  const limit = parseInt(searchParams.get('limit') || '10')

  console.log(`📥 Donations API: ${type} request`, { userId, limit })

  try {
    switch (type) {
      case 'stats':
        console.log('📊 Getting donation stats...')
        // Obtener estadísticas generales
        const { data: stats, error: statsError } = await getDonationStats()
        if (statsError) {
          console.error('❌ Stats error:', statsError)
          throw statsError
        }
        console.log('✅ Stats retrieved:', stats)
        return Response.json({ data: stats })

      case 'recent':
        console.log('📋 Getting recent donations...')
        // Obtener donaciones recientes
        const { data: recent, error: recentError } = await getRecentDonations(limit)
        if (recentError) {
          console.error('❌ Recent donations error:', recentError)
          throw recentError
        }
        console.log(`✅ Retrieved ${recent?.length || 0} recent donations`)
        return Response.json({ data: recent })

      case 'user':
        // Obtener donaciones de un usuario específico
        if (!userId) {
          return Response.json({ error: 'user_id required' }, { status: 400 })
        }
        const { data: userDonations, error: userError } = await getUserDonations(userId)
        if (userError) throw userError
        return Response.json({ data: userDonations })

      case 'admin':
        console.log('🔧 Getting admin donations...')
        // Obtener todas las donaciones (solo para admin)
        const { data: allDonations, error: adminError } = await supabaseAdmin
          .from('donations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit)

        if (adminError) {
          console.error('❌ Admin query error:', adminError)
          throw adminError
        }
        console.log(`✅ Retrieved ${allDonations?.length || 0} admin donations`)
        return Response.json({ data: allDonations })

      default:
        return Response.json({ error: 'Invalid type parameter' }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error('❌ Donations API error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message.includes('relation "donations" does not exist')) {
      return Response.json({ 
        error: 'Database table not created yet. Please apply the SQL schema in Supabase.',
        details: 'Run the SQL from sql/donations_schema.sql in Supabase SQL Editor'
      }, { status: 500 })
    }
    
    return Response.json({ error: message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    switch (action) {
      case 'test_donation':
        // Crear una donación de prueba
        const testDonation = {
          user_id: body.user_id || null,
          payment_provider: body.payment_provider || 'stripe',
          payment_id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          session_id: `sess_test_${Date.now()}`,
          amount_cents: body.amount_cents || 500,
          currency: body.currency || 'usd',
          donor_email: body.donor_email || 'test@example.com',
          donor_name: body.donor_name || 'Test Donor',
          message: body.message || 'Test donation',
          metadata: { test: true, created_via: 'api_test' }
        }

        const { data: testData, error: testError } = await supabaseAdmin
          .from('donations')
          .insert(testDonation)
          .select()
          .single()

        if (testError) throw testError

        console.log('🧪 Test donation created:', testData.id)
        return Response.json({ data: testData })

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error('❌ Donations POST error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
