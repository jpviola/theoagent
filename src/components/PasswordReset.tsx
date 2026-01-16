'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'

interface PasswordResetProps {
  onClose: () => void
  onSuccess?: () => void
  onBackToSignin?: () => void
  initialEmail?: string
}

export default function PasswordReset({ onClose, onSuccess, onBackToSignin, initialEmail = '' }: PasswordResetProps) {
  const [step, setStep] = useState<'request' | 'confirm' | 'success'>('request')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Request reset state
  const [email, setEmail] = useState(initialEmail)
  
  // Password reset state (from URL params)
  const [accessToken, setAccessToken] = useState('')
  const [refreshToken, setRefreshToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordFeedback, setPasswordFeedback] = useState<string[]>([])

  useEffect(() => {
    // Check if we're in password reset flow (from email link)
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('access_token')
    const refresh = urlParams.get('refresh_token')
    const type = urlParams.get('type')
    
    if (token && refresh && type === 'recovery') {
      setAccessToken(token)
      setRefreshToken(refresh)
      setStep('confirm')
      
      // Clear URL params for security
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  useEffect(() => {
    if (newPassword) {
      evaluatePasswordStrength(newPassword)
    } else {
      setPasswordStrength(0)
      setPasswordFeedback([])
    }
  }, [newPassword])

  const evaluatePasswordStrength = (password: string) => {
    let strength = 0
    const feedback: string[] = []

    if (password.length >= 8) {
      strength += 1
    } else {
      feedback.push('At least 8 characters')
    }

    if (/[a-z]/.test(password)) {
      strength += 1
    } else {
      feedback.push('Lowercase letter')
    }

    if (/[A-Z]/.test(password)) {
      strength += 1
    } else {
      feedback.push('Uppercase letter')
    }

    if (/\d/.test(password)) {
      strength += 1
    } else {
      feedback.push('Number')
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      strength += 1
    } else {
      feedback.push('Special character')
    }

    setPasswordStrength(strength)
    setPasswordFeedback(feedback)
  }

  const getStrengthColor = (strength: number) => {
    if (strength <= 2) return 'bg-red-500'
    if (strength <= 3) return 'bg-yellow-500'
    if (strength <= 4) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getStrengthText = (strength: number) => {
    if (strength <= 2) return 'Weak'
    if (strength <= 3) return 'Fair'
    if (strength <= 4) return 'Good'
    return 'Strong'
  }

  const requestPasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`
      })
      
      if (error) throw error
      
      setSuccess('Password reset link sent! Check your email.')
      setStep('success')
    } catch (error: unknown) {
      console.error('Password reset request error:', error)
      if (error instanceof Error) {
        setError(error.message || 'Failed to send reset email')
      } else {
        setError('Failed to send reset email')
      }
    } finally {
      setLoading(false)
    }
  }

  const confirmPasswordReset = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (passwordStrength < 3) {
      setError('Password is not strong enough')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      // Set the session using the tokens from the URL
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })
      
      if (sessionError) throw sessionError

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (updateError) throw updateError
      
      setSuccess('Password updated successfully!')
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 2000)
    } catch (error: unknown) {
      console.error('Password reset confirmation error:', error)
      if (error instanceof Error) {
        setError(error.message || 'Failed to reset password')
      } else {
        setError('Failed to reset password')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">
              {step === 'request' ? 'Reset Password' :
               step === 'confirm' ? 'Set New Password' :
               'Check Your Email'}
            </h1>
            <p className="text-white/90 mt-2 text-sm">
              {step === 'request' ? 'Enter your email to receive a reset link' :
               step === 'confirm' ? 'Choose a secure new password' :
               'We\'ve sent you a reset link'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* Request Password Reset */}
          {step === 'request' && (
            <div className="space-y-6">
              <div className="text-center text-gray-600">
                <p>Enter your email address and we&apos;ll send you a link to reset your password.</p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <button
                onClick={requestPasswordReset}
                disabled={loading || !email}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              {onBackToSignin && (
                <div className="text-center">
                  <button
                    onClick={onBackToSignin}
                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Confirm Password Reset */}
          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="text-center text-gray-600">
                <p>Please enter your new password below.</p>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter new password"
                  required
                />
                
                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Password strength:</span>
                      <span className={`text-sm font-medium ${
                        passwordStrength <= 2 ? 'text-red-600' :
                        passwordStrength <= 3 ? 'text-yellow-600' :
                        passwordStrength <= 4 ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {getStrengthText(passwordStrength)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getStrengthColor(passwordStrength)}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                    {passwordFeedback.length > 0 && (
                      <div className="text-xs text-gray-600">
                        Missing: {passwordFeedback.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    confirmPassword && newPassword !== confirmPassword 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Confirm new password"
                  required
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">Passwords do not match</p>
                )}
              </div>

              <button
                onClick={confirmPasswordReset}
                disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || passwordStrength < 3}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          )}

          {/* Success State */}
          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Check Your Email</h3>
                <p className="text-gray-600 mb-6">
                  We&apos;ve sent a password reset link to <strong>{email}</strong>. 
                  Click the link in the email to set your new password.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
                <h4 className="font-medium text-blue-900 mb-2">Didn&apos;t receive the email?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Check your spam/junk folder</li>
                  <li>• Make sure {email} is correct</li>
                  <li>• Wait a few minutes for delivery</li>
                </ul>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setStep('request')}
                  className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl transition-colors"
                >
                  Try Different Email
                </button>

                {onBackToSignin && (
                  <button
                    onClick={onBackToSignin}
                    className="w-full text-blue-600 hover:text-blue-800 underline"
                  >
                    Back to Sign In
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
