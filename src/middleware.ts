import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Handle legacy/implicit favicon requests early (avoid Supabase work and 404s)
  const pathname = request.nextUrl.pathname;

  if (pathname === '/favicon.ico') {
    return NextResponse.redirect(new URL('/santapalabra-logoSinLeyenda.ico', request.url));
  }

  if (pathname === '/favicon.svg') {
    return NextResponse.redirect(new URL('/santapalabra-logo.svg', request.url));
  }

  // Some tools reference PNG favicons that may not exist in this repo.
  if (
    pathname === '/favicon-16x16.png' ||
    pathname === '/favicon-32x32.png' ||
    pathname === '/favicon-48x48.png' ||
    pathname === '/apple-touch-icon.png' ||
    pathname === '/android-chrome-192x192.png' ||
    pathname === '/android-chrome-512x512.png'
  ) {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+uZ5sAAAAASUVORK5CYII=';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new NextResponse(bytes, {
      headers: {
        'content-type': 'image/png',
        'cache-control': 'public, max-age=31536000, immutable',
      },
    });
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not available in middleware')
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { user }, error } = await supabase.auth.getUser()

  // Define protected routes
  // REMOVED /admin from protectedRoutes because it uses custom cookie-based auth
  const protectedRoutes = ['/dashboard', '/settings']
  const authRoutes = ['/auth/signin', '/auth/signup']
  
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Handle protected routes
  if (isProtectedRoute && (!user || error)) {
    const url = new URL('/auth/signin', request.url)
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Handle auth routes when user is already signed in
  if (isAuthRoute && user && !error) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  if (request.nextUrl.pathname.startsWith('/api/')) {
    const publicApiRoutes = [
      '/api/health',
      '/api/webhook',
      '/api/catholic-rag',
      '/api/catholic-simple',
      '/api/tts',
      '/api/elevenlabs/single-use-token',
      '/api/payments',
      '/api/webhooks',
      '/api/admin', // Added /api/admin to public routes for middleware (handled by cookie check internally)
    ]
    const isPublicApiRoute = publicApiRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )

    // Also check if it starts with /api/admin explicitly to be safe
    const isAdminApiRoute = request.nextUrl.pathname.startsWith('/api/admin');

    if (!isPublicApiRoute && !isAdminApiRoute && (!user || error)) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { 'content-type': 'application/json' } 
        }
      )
    }

    // Add user ID to headers for API routes
    if (user) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', user.id)
      requestHeaders.set('x-user-email', user.email || '')
      
      response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - public folder
     */
    '/((?!_next/static|_next/image|public/).*)',
  ],
}
