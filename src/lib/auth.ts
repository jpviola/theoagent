import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './supabase'

type Profile = Database['public']['Tables']['profiles']['Row'];

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function getUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

export async function getUserProfile(): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient()
  const user = await getUser()
  
  if (!user) {
    return null
  }
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
  
  return profile as Profile
}

export async function updateUserUsage(userId: string) {
  // This function is deprecated - usage is now handled in the API route
  console.log('Usage update handled in API route for user:', userId)
}

export async function checkUsageLimits(userId: string): Promise<{ canUse: boolean, currentUsage: number, limit: number }> {
  const profile = await getUserProfile()
  
  if (!profile) {
    return { canUse: false, currentUsage: 0, limit: 0 }
  }
  
  const limits = {
    free: 10,
    plus: 100,
    expert: -1 // unlimited
  } as const;
  
  const userTier = profile.subscription_tier as keyof typeof limits;
  const limit = limits[userTier];
  
  return {
    canUse: limit === -1 || profile.usage_count_today < limit,
    currentUsage: profile.usage_count_today,
    limit
  }
}

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  return await supabase.auth.signOut()
}

export async function refreshSession() {
  const supabase = await createServerSupabaseClient()
  return await supabase.auth.refreshSession()
}

export async function resendEmailConfirmation(email: string) {
  const supabase = await createServerSupabaseClient()
  return await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    }
  })
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { 
  isValid: boolean, 
  errors: string[], 
  strength: number 
} {
  const errors: string[] = []
  let strength = 0
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  } else {
    strength++
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  } else {
    strength++
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  } else {
    strength++
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  } else {
    strength++
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character')
  } else {
    strength++
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  }
}

export async function updateUserProfile(updates: any) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // No-op for server components
        },
      },
    }
  )
  const user = await getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
  
  if (error) {
    throw error
  }
  
  return true
}