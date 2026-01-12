'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import type { Database } from '@/lib/supabase'
import { authAnalytics } from '@/lib/auth-analytics'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'signin' | 'signup' | 'reset' | 'verify-email'
  redirectTo?: string
  showSocialLogin?: boolean
  onSuccess?: () => void
}

type AuthMode = 'signin' | 'signup' | 'reset' | 'verify-email' | 'mfa-setup' | 'mfa-verify'

// Social providers configuration
const SOCIAL_PROVIDERS = [
  { 
    name: 'Google', 
    provider: 'google' as const, 
    icon: '🔵',
    color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200' 
  },
  { 
    name: 'Facebook', 
    provider: 'facebook' as const, 
    icon: '🟦', 
    color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
  }
]

export default function AuthModal({ 
  isOpen, 
  onClose, 
  initialMode = 'signin',
  redirectTo,
  showSocialLogin = true,
  onSuccess
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [institutionName, setInstitutionName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [rememberMe, setRememberMe] = useState(true)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [mfaToken, setMfaToken] = useState('')
  const [isEmailValid, setIsEmailValid] = useState(true)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  useEffect(() => {
    if (email) {
      setIsEmailValid(validateEmail(email))
    }
  }, [email])

  // Close modal with Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const checkPasswordStrength = (password: string): number => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++ // Bonus for longer passwords
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    if (!/(..).*\1/.test(password)) strength++ // No repeated pairs
    return Math.min(strength, 5) // Cap at 5
  }

  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword)
    setPasswordStrength(checkPasswordStrength(newPassword))
  }

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength <= 2) return 'bg-red-500'
    if (strength <= 3) return 'bg-yellow-500'
    if (strength <= 4) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = (strength: number): string => {
    if (strength <= 2) return 'Weak'
    if (strength <= 3) return 'Fair'
    if (strength <= 4) return 'Good'
    return 'Excellent'
  }

  const getPasswordRequirements = () => [
    { met: password.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
    { met: /[a-z]/.test(password), text: 'One lowercase letter' },
    { met: /[0-9]/.test(password), text: 'One number' },
    { met: /[^A-Za-z0-9]/.test(password), text: 'One special character' }
  ]

  const getErrorMessage = (error: string | any): string => {
    if (typeof error === 'string') {
      const errorMappings: Record<string, string> = {
        'Invalid login credentials': 'Invalid email or password. Please double-check your credentials.',
        'Email not confirmed': 'Please verify your email address first. Check your inbox for the confirmation link.',
        'User already registered': 'An account with this email already exists. Try signing in instead.',
        'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
        'Signup requires a valid password': 'Please enter a valid password.',
        'Unable to validate email address': 'Please enter a valid email address.',
        'Email rate limit exceeded': 'Too many requests. Please wait a moment before trying again.',
        'Invalid email': 'Please enter a valid email address.',
        'Weak password': 'Password is too weak. Please use a stronger password.',
        'signups not allowed': 'New signups are temporarily disabled. Please try again later.'
      }
      
      for (const [key, value] of Object.entries(errorMappings)) {
        if (error.toLowerCase().includes(key.toLowerCase())) {
          return value
        }
      }
      return error
    }
    if (error?.message) return error.message
    return 'An unexpected error occurred. Please try again.'
  }

  // Social login handler
  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setSocialLoading(provider)
    setError('')
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo || `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) throw error
      
      authAnalytics.signupStarted(email || 'social', provider)
      onSuccess?.()
      
    } catch (error: any) {
      setError(getErrorMessage(error))
    } finally {
      setSocialLoading(null)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!isEmailValid) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    if (!password.trim()) {
      setError('Password is required')
      setLoading(false)
      return
    }

    authAnalytics.signinStarted(email, 'email')

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        authAnalytics.signinCompleted(data.user.id, email, 'email')
        setSuccess('🎉 Welcome back!')
        onSuccess?.()
        
        setTimeout(() => {
          onClose()
        }, 1000)
      }
      
    } catch (error: any) {
      setError(getErrorMessage(error))
      authAnalytics.signinFailed(email, error.message, 'email')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Enhanced validation
    if (!isEmailValid) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    if (!fullName.trim()) {
      setError('Full name is required')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (passwordStrength < 3) {
      setError('Please create a stronger password. Use at least 8 characters with uppercase, lowercase, numbers, and special characters.')
      setLoading(false)
      return
    }

    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy')
      setLoading(false)
      return
    }

    // Analytics: Track signup attempt
    authAnalytics.signupStarted(email, 'email')

    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            institution_name: institutionName.trim(),
            created_via: 'modal',
            signup_source: window.location.pathname
          },
          emailRedirectTo: redirectTo || `${window.location.origin}/auth/callback`
        },
      })

      if (error) throw error

      // Analytics: Track successful signup
      if (data.user) {
        authAnalytics.signupCompleted(data.user.id, email, 'email')
        authAnalytics.emailVerificationSent(email)
      }

      setSuccess('🎉 Account created successfully! Please check your email to verify your account.')
      setMode('verify-email')
      onSuccess?.()
      
    } catch (error: any) {
      setError(getErrorMessage(error))
      authAnalytics.signinFailed(email, error.message, 'email')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Analytics: Track password reset attempt
    authAnalytics.passwordResetRequested(email)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })
      
      if (error) throw error

      setSuccess('✅ Password reset email sent! Please check your inbox and follow the instructions.')
      setEmail('')
      
      setTimeout(() => {
        setMode('signin')
      }, 3000)
      
    } catch (error: any) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-gray-100">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#F4B400] to-[#FFCC00] rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">⛪</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'signin' && 'Welcome Back'}
              {mode === 'signup' && 'Join TheoAgent'}
              {mode === 'reset' && 'Reset Password'}
              {mode === 'verify-email' && 'Check Your Email'}
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              {mode === 'signin' && 'Sign in to access your theological assistant'}
              {mode === 'signup' && 'Create your account to get started'}
              {mode === 'reset' && 'Enter your email to reset your password'}
              {mode === 'verify-email' && 'Please verify your email address to continue'}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Alerts */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          {/* Social Login Section */}
          {showSocialLogin && (mode === 'signin' || mode === 'signup') && (
            <div className="space-y-3 mb-6">
              {SOCIAL_PROVIDERS.map((provider) => (
                <button
                  key={provider.provider}
                  onClick={() => handleSocialLogin(provider.provider)}
                  disabled={socialLoading === provider.provider}
                  className={`w-full flex items-center justify-center gap-3 px-4 py-3 border rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${provider.color}`}
                >
                  <span className="text-xl">{provider.icon}</span>
                  {socialLoading === provider.provider ? 'Connecting...' : `Continue with ${provider.name}`}
                </button>
              ))}
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>
            </div>
          )}

          {/* Email Verification Mode */}
          {mode === 'verify-email' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Check your email</h3>
                <p className="text-sm text-gray-600">
                  We sent a verification link to <strong>{email}</strong>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Didn't receive the email? Check your spam folder or contact support.
                </p>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setMode('signin')}
                  className="w-full text-blue-600 hover:text-blue-500 text-sm font-medium"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* Main Forms */}
          {(mode === 'signin' || mode === 'signup' || mode === 'reset') && (
            <form onSubmit={
              mode === 'signin' ? handleSignIn : 
              mode === 'signup' ? handleSignUp : 
              handlePasswordReset
            } className="space-y-4">
              
              {/* Signup Fields */}
              {mode === 'signup' && (
                <>
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="institutionName" className="block text-sm font-medium text-gray-700 mb-1">
                      Institution (Optional)
                    </label>
                    <input
                      type="text"
                      id="institutionName"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="School, Parish, Seminary, etc."
                    />
                  </div>
                </>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    !isEmailValid && email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                  required
                />
                {!isEmailValid && email && (
                  <p className="mt-1 text-sm text-red-600">Please enter a valid email address</p>
                )}
              </div>

              {/* Password Field */}
              {mode !== 'reset' && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <svg className="h-4 w-4 text-gray-400" fill={showPassword ? 'none' : 'currentColor'} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPassword ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.465 8.465M9.878 9.878a3 3 0 00-.007 4.243m4.249-4.25l1.413-1.413M14.121 14.121L22 22"} />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Password Strength for Signup */}
                  {mode === 'signup' && password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Password strength:</span>
                        <span className={`font-medium ${getPasswordStrengthColor(passwordStrength).replace('bg-', 'text-')}`}>
                          {getPasswordStrengthText(passwordStrength)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all ${getPasswordStrengthColor(passwordStrength)}`} style={{width: `${(passwordStrength / 5) * 100}%`}}></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Confirm Password Field */}
              {mode === 'signup' && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      confirmPassword && password !== confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                    required
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                  )}
                </div>
              )}

              {/* Terms Agreement for Signup */}
              {mode === 'signup' && (
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="agreedToTerms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    required
                  />
                  <label htmlFor="agreedToTerms" className="ml-2 text-sm text-gray-600">
                    I agree to the <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
                  </label>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || (mode === 'signup' && (password !== confirmPassword || passwordStrength < 3))}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-4 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>
                      {mode === 'signin' && 'Signing In...'}
                      {mode === 'signup' && 'Creating Account...'}
                      {mode === 'reset' && 'Sending Reset Link...'}
                    </span>
                  </div>
                ) : (
                  <>
                    {mode === 'signin' && 'Sign In to TheoAgent'}
                    {mode === 'signup' && 'Create Free Account'}
                    {mode === 'reset' && 'Send Reset Link'}
                  </>
                )}
              </button>

              {/* Forgot Password Link for Sign In */}
              {mode === 'signin' && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Mode switching */}
          <div className="mt-6 text-center space-y-2">
            {mode === 'reset' ? (
              <button
                onClick={() => setMode('signin')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ← Back to Sign In
              </button>
            ) : (
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {mode === 'signin' 
                  ? "Don't have an account? Create one free" 
                  : 'Already have an account? Sign in'
                }
              </button>
            )}
          </div>

          {/* Additional info */}
          {mode === 'signup' && (
            <div className="mt-4 text-xs text-gray-500 text-center space-y-1">
              <p>🆓 Start with 10 free daily consultations</p>
              <p>📧 Email verification required</p>
              <p>⛪ 100% Catholic orthodox teaching</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}