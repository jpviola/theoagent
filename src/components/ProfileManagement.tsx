'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { SUBSCRIPTION_TIERS } from '@/lib/subscription-db'

interface ProfileManagementProps {
  user: any
  onClose?: () => void
  onProfileUpdated?: () => void
}

interface UserProfile {
  id: string
  full_name: string | null
  institution_name: string | null
  subscription_tier: 'free' | 'plus' | 'expert'
  subscription_status: 'active' | 'canceled' | 'past_due'
  usage_count_today: number
  usage_reset_date: string
  created_at: string
}

export default function ProfileManagement({ 
  user, 
  onClose, 
  onProfileUpdated 
}: ProfileManagementProps) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'billing'>('profile')
  const [formData, setFormData] = useState({
    full_name: '',
    institution_name: '',
    email: user?.email || ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  useEffect(() => {
    if (user) {
      loadProfile()
      setFormData({
        full_name: user.user_metadata?.full_name || '',
        institution_name: user.user_metadata?.institution_name || '',
        email: user.email || ''
      })
    }
  }, [user])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        setError('Failed to load profile data')
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Profile loading error:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setError('')
    setSuccess('')

    try {
      // Update user metadata in auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name.trim(),
          institution_name: formData.institution_name.trim()
        }
      })

      if (authError) throw authError

      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          institution_name: formData.institution_name.trim()
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      setSuccess('Profile updated successfully!')
      onProfileUpdated?.()
      
      // Reload profile data
      await loadProfile()

    } catch (error: any) {
      setError(error.message || 'Failed to update profile')
    } finally {
      setUpdating(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setError('')
    setSuccess('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match')
      setUpdating(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      setUpdating(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      setSuccess('Password updated successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })

    } catch (error: any) {
      setError(error.message || 'Failed to update password')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    const confirmation = prompt('Type "DELETE" to confirm account deletion:')
    if (confirmation !== 'DELETE') {
      return
    }

    setUpdating(true)
    setError('')

    try {
      // Note: This would typically involve a server-side endpoint for complete deletion
      // For now, we'll just sign out the user
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error: any) {
      setError('Failed to delete account. Please contact support.')
      setUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getUsagePercentage = () => {
    if (!profile) return 0
    const tier = SUBSCRIPTION_TIERS[profile.subscription_tier]
    if (tier.limits.dailyMessages === -1) return 0 // Unlimited
    return Math.min((profile.usage_count_today / tier.limits.dailyMessages) * 100, 100)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2 text-gray-600">Loading profile...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
                <p className="text-sm text-gray-600">Manage your account and preferences</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-6 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'profile', name: 'Profile', icon: '👤' },
              { id: 'security', name: 'Security', icon: '🔒' },
              { id: 'billing', name: 'Usage & Billing', icon: '💳' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="institution_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Institution <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="institution_name"
                    value={formData.institution_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, institution_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Seminary, University, Parish, etc."
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl cursor-not-allowed"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed. Contact support if you need to update your email.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    'Update Profile'
                  )}
                </button>
              </form>

              {/* Account Information */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Account Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member since:</span>
                    <span className="font-medium">{profile && formatDate(profile.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account ID:</span>
                    <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">{user.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email verified:</span>
                    <span className={`font-medium ${user.email_confirmed_at ? 'text-green-600' : 'text-red-600'}`}>
                      {user.email_confirmed_at ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          placeholder="Enter new password"
                          minLength={6}
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {showPasswords.new ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L19.071 19.07" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            )}
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-300'
                          }`}
                          placeholder="Confirm new password"
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {showPasswords.confirm ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L19.071 19.07" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            )}
                          </svg>
                        </button>
                      </div>
                      {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={updating}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
                  >
                    {updating ? (
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Updating...</span>
                      </div>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </form>

              {/* Danger Zone */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Danger Zone</h3>
                <p className="text-sm text-red-600 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  disabled={updating}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {/* Usage & Billing Tab */}
          {activeTab === 'billing' && profile && (
            <div className="space-y-6">
              {/* Current Plan */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Current Plan</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    profile.subscription_tier === 'free' ? 'bg-gray-100 text-gray-800' :
                    profile.subscription_tier === 'plus' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {SUBSCRIPTION_TIERS[profile.subscription_tier].name}
                  </span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Daily Usage</p>
                    <div className="flex items-end space-x-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {profile.usage_count_today}
                      </span>
                      <span className="text-sm text-gray-600">
                        / {SUBSCRIPTION_TIERS[profile.subscription_tier].limits.dailyMessages === -1 
                          ? '∞' 
                          : SUBSCRIPTION_TIERS[profile.subscription_tier].limits.dailyMessages} questions
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getUsagePercentage()}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Resets</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(profile.usage_reset_date)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Plan Features */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Plan Features</h3>
                <div className="grid gap-3">
                  {SUBSCRIPTION_TIERS[profile.subscription_tier].features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upgrade CTA */}
              {profile.subscription_tier === 'free' && (
                <div className="bg-gradient-to-r from-[#F4B400] to-[#FFCC00] rounded-xl p-6 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Unlock More?</h3>
                  <p className="text-gray-800 mb-4">
                    Upgrade to Plus or Expert for unlimited questions, advanced modes, and premium features.
                  </p>
                  <button className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-xl transition-colors">
                    View Pricing Plans
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}