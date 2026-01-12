'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function AuthDebugPanel() {
  const [authState, setAuthState] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuthState()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔍 AuthDebugPanel - Auth changed:', event)
      setUser(session?.user || null)
      checkAuthState()
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user
      
      let profileData = null
      if (currentUser) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single()
          profileData = data
        } catch (error) {
          console.error('Profile fetch error:', error)
        }
      }

      setAuthState({
        hasSession: !!session,
        hasUser: !!currentUser,
        userId: currentUser?.id,
        email: currentUser?.email,
        emailConfirmed: !!currentUser?.email_confirmed_at,
        userMetadata: currentUser?.user_metadata,
        profileData,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Auth state check error:', error)
      setAuthState({ error: error instanceof Error ? error.message : 'Unknown error occurred' })
    }
  }

  const skipOnboarding = async () => {
    try {
      await supabase.auth.updateUser({
        data: { onboarding_completed: true }
      })
      console.log('✅ Onboarding marked as completed in metadata')
      checkAuthState()
      window.location.reload()
    } catch (error) {
      console.error('Skip onboarding error:', error)
    }
  }

  if (!authState) {
    return <div className="p-4 bg-blue-50 text-blue-800">Loading auth state...</div>
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-red-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <h3 className="font-bold text-red-600 mb-2">🔧 Auth Debug Panel</h3>
      
      <div className="text-xs space-y-1">
        <div><strong>Session:</strong> {authState.hasSession ? '✅' : '❌'}</div>
        <div><strong>User:</strong> {authState.hasUser ? '✅' : '❌'}</div>
        {authState.email && <div><strong>Email:</strong> {authState.email}</div>}
        <div><strong>Email Confirmed:</strong> {authState.emailConfirmed ? '✅' : '❌'}</div>
        
        {authState.userMetadata && (
          <div>
            <strong>User Metadata:</strong>
            <pre className="text-xs bg-gray-100 p-1 rounded mt-1">
              {JSON.stringify(authState.userMetadata, null, 2)}
            </pre>
          </div>
        )}
        
        {authState.profileData && (
          <div>
            <strong>Profile Data:</strong>
            <pre className="text-xs bg-gray-100 p-1 rounded mt-1">
              {JSON.stringify(authState.profileData, null, 2)}
            </pre>
          </div>
        )}
        
        {authState.error && (
          <div className="text-red-600"><strong>Error:</strong> {authState.error}</div>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <button
          onClick={skipOnboarding}
          className="w-full bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
        >
          Skip Onboarding & Enter App
        </button>
        
        <button
          onClick={checkAuthState}
          className="w-full bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
        >
          Refresh Auth State
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700"
        >
          Reload Page
        </button>
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        Updated: {new Date(authState.timestamp).toLocaleTimeString()}
      </div>
    </div>
  )
}