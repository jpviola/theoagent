'use client'

import { useAuth } from '@/lib/auth-context'

interface AuthStatusProps {
  showDetails?: boolean
  className?: string
}

export default function AuthStatus({ showDetails = false, className = '' }: AuthStatusProps) {
  const { user, profile, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        Not signed in
      </div>
    )
  }

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm font-medium text-gray-900">
          {profile?.full_name || user.email}
        </span>
      </div>
      
      {showDetails && (
        <div className="text-xs text-gray-500">
          <div>Tier: {profile?.subscription_tier || 'free'}</div>
          <div>
            Usage: {profile?.usage_count_today || 0}
            {profile?.subscription_tier === 'free' && '/10'}
            {profile?.subscription_tier === 'plus' && '/100'}
            {profile?.subscription_tier === 'expert' && ' (unlimited)'}
          </div>
        </div>
      )}
      
      <button
        onClick={handleSignOut}
        className="text-xs text-gray-500 hover:text-red-600 underline"
      >
        Sign Out
      </button>
    </div>
  )
}