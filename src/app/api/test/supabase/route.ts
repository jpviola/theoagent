import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🧪 Testing Supabase connection...')
    
    // Test básico de conectividad
    const { data, error } = await supabase
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
    
  } catch (error: any) {
    console.error('❌ Supabase test error:', error)
    return Response.json({ 
      status: 'error',
      message: error.message 
    }, { status: 500 })
  }
}

export async function POST() {
  return Response.json({ message: 'Use GET method' }, { status: 405 })
}