'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/lib/auth-context'

export default function AuthDebugDashboard() {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showSignIn, setShowSignIn] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user || null)
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user || null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Signed in successfully!')
        setShowSignIn(false)
        setEmail('')
        setPassword('')
      }
    } catch (error) {
      setMessage(`Error: ${error}`)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Sign up successful! Check your email for verification.')
        setEmail('')
        setPassword('')
      }
    } catch (error) {
      setMessage(`Error: ${error}`)
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      setMessage(`Error signing out: ${error.message}`)
    } else {
      setMessage('Signed out successfully!')
    }
  }

  if (loading) {
    return <div className="p-8">Loading authentication status...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Authentication Dashboard</h1>
        
        {/* Current Status */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Current Status</h2>
          <div className="space-y-2">
            <p><strong>Authenticated:</strong> {user ? '✅ Yes' : '❌ No'}</p>
            {user && (
              <>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Email Verified:</strong> {user.email_confirmed_at ? '✅ Yes' : '❌ No'}</p>
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</p>
              </>
            )}
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg mb-4 ${
            message.includes('Error') 
              ? 'bg-red-100 border border-red-300 text-red-700'
              : 'bg-green-100 border border-green-300 text-green-700'
          }`}>
            {message}
          </div>
        )}

        {/* Authentication Actions */}
        <div className="space-y-4">
          {!user ? (
            <>
              <button
                onClick={() => setShowSignIn(!showSignIn)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showSignIn ? 'Cancel' : 'Sign In / Sign Up'}
              </button>

              {showSignIn && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSignIn}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={handleSignUp}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Sign Up
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Navigation to Catholic System */}
        <div className="border-t pt-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Catholic Theology System</h2>
          <div className="flex gap-4">
            <a
              href="/test-rag"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Test Catholic AI
            </a>
            {user && (
              <a
                href="/admin"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Admin Dashboard
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}