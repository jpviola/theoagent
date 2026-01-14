import { createClient } from '@supabase/supabase-js'
import { NextResponse, NextRequest } from 'next/server'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`
    )
  }

  if (code) {
    try {
      const { error: exchangeError, data } = await supabaseAdmin.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        return NextResponse.redirect(
          `${origin}/auth/auth-code-error?error=code_exchange_failed&description=${encodeURIComponent(exchangeError.message)}`
        )
      }

      // Handle different callback types
      if (type === 'recovery') {
        // Password reset flow - redirect to a password update page
        return NextResponse.redirect(`${origin}/?message=password_reset_success`)
      }

      // Email confirmation or regular OAuth flow
      if (data?.user?.email_confirmed_at) {
        return NextResponse.redirect(`${origin}/?message=email_confirmed`)
      }

      // Regular successful authentication
      return NextResponse.redirect(`${origin}/?message=auth_success`)
      
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=unexpected_error`)
    }
  }

  // No code provided
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code_provided`)
}
