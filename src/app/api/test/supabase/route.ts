import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    console.log('🧪 Testing Supabase connection...')
    
    // Test básico de conectividad
    const { error } = await supabaseAdmin
      .from('profiles')  // Esta tabla ya existe
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase connection error:', error)
      return Response.json({ 
        status: 'error',
        message: error.message,
        hint: error.hint 
      }, { status: 500 })
    }
    
    console.log('✅ Supabase connection successful')
    return Response.json({ 
      status: 'ok',
      message: 'Supabase connection working',
      timestamp: new Date().toISOString()
    })
    
  } catch (error: unknown) {
    console.error('❌ Supabase test error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ 
      status: 'error',
      message 
    }, { status: 500 })
  }
}

export async function POST() {
  return Response.json({ message: 'Use GET method' }, { status: 405 })
}
