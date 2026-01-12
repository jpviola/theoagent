'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase-client'

interface MFASetupProps {
  user: any
  onClose: () => void
  onSuccess?: () => void
  enforced?: boolean // Whether MFA is required
}

export default function MFASetup({ user, onClose, onSuccess, enforced = false }: MFASetupProps) {
  const [step, setStep] = useState<'verify' | 'setup' | 'challenge' | 'recovery'>('verify')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // MFA Setup state
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  
  // Challenge state
  const [challengeId, setChallengeId] = useState('')
  const [challengeCode, setChallengeCode] = useState('')
  
  // Current MFA factors
  const [mfaFactors, setMfaFactors] = useState<any[]>([])
  const [hasActiveMFA, setHasActiveMFA] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    checkMFAStatus()
  }, [])

  const checkMFAStatus = async () => {
    try {
      const { data: factors, error } = await supabase.auth.mfa.listFactors()
      if (error) throw error
      
      setMfaFactors(factors?.totp || [])
      const activeFactor = factors?.totp?.find(f => f.status === 'verified')
      setHasActiveMFA(!!activeFactor)
      
      if (activeFactor && !enforced) {
        setStep('verify')
      } else if (!activeFactor) {
        setStep('setup')
      }
    } catch (error: any) {
      console.error('MFA status check error:', error)
      setError('Failed to check MFA status')
    }
  }

  const enrollMFA = async () => {
    setLoading(true)
    setError('')
    
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'TheoAgent',
        friendlyName: `TheoAgent - ${user.email}`
      })
      
      if (error) throw error
      
      setQrCode(data.totp.qr_code)
      setSecret(data.totp.secret)
      setStep('challenge')
    } catch (error: any) {
      console.error('MFA enrollment error:', error)
      setError(error.message || 'Failed to setup MFA')
    } finally {
      setLoading(false)
    }
  }

  const verifyMFA = async () => {
    setLoading(true)
    setError('')
    
    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: mfaFactors[0]?.id,
        code: verificationCode
      })
      
      if (error) throw error
      
      setSuccess('MFA verified successfully!')
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (error: any) {
      console.error('MFA verification error:', error)
      setError('Invalid verification code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const challengeMFA = async () => {
    setLoading(true)
    setError('')
    
    try {
      const factorId = mfaFactors[0]?.id
      if (!factorId) {
        throw new Error('No MFA factor found')
      }

      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: factorId
      })
      
      if (error) throw error
      
      setChallengeId(data.id)
      setStep('challenge')
    } catch (error: any) {
      console.error('MFA challenge error:', error)
      setError(error.message || 'Failed to create MFA challenge')
    } finally {
      setLoading(false)
    }
  }

  const completeMFASetup = async () => {
    setLoading(true)
    setError('')
    
    try {
      // First get the factor ID from enrollment
      const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors()
      if (factorError) throw factorError
      
      const unverifiedFactor = factors?.totp?.find(f => f.factor_type === 'totp')
      if (!unverifiedFactor) throw new Error('No unverified factor found')

      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: unverifiedFactor.id,
        code: challengeCode
      })
      
      if (error) throw error
      
      // Generate recovery codes
      await generateRecoveryCodes()
      
      setSuccess('MFA setup completed successfully!')
      setStep('recovery')
    } catch (error: any) {
      console.error('MFA setup completion error:', error)
      setError('Invalid code. Please check your authenticator app and try again.')
    } finally {
      setLoading(false)
    }
  }

  const generateRecoveryCodes = async () => {
    try {
      // For now, generate client-side recovery codes
      // In a real app, these should be generated server-side
      const codes = Array.from({ length: 8 }, () => 
        Math.random().toString(36).substr(2, 8).toUpperCase()
      )
      setRecoveryCodes(codes)
      
      // Save to user metadata
      await supabase.auth.updateUser({
        data: { recovery_codes: codes }
      })
    } catch (error) {
      console.error('Recovery code generation error:', error)
    }
  }

  const downloadRecoveryCodes = () => {
    const codesText = [
      'TheoAgent Recovery Codes',
      '========================',
      '',
      'Save these codes in a safe place. You can use them to access your account',
      'if you lose access to your authenticator app.',
      '',
      'Each code can only be used once.',
      '',
      ...recoveryCodes.map((code, i) => `${i + 1}. ${code}`),
      '',
      `Generated on: ${new Date().toLocaleDateString()}`,
      `Account: ${user.email}`
    ].join('\n')

    const blob = new Blob([codesText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'theoagent-recovery-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCodeInput = (index: number, value: string) => {
    if (value.length > 1) return
    
    const newCode = challengeCode.split('')
    newCode[index] = value
    setChallengeCode(newCode.join(''))
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !challengeCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const canClose = !enforced || hasActiveMFA

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">
              {step === 'setup' ? 'Setup Two-Factor Authentication' :
               step === 'challenge' ? 'Verify Your Code' :
               step === 'recovery' ? 'Save Recovery Codes' :
               'Two-Factor Authentication'}
            </h1>
            <p className="text-white/90 mt-2 text-sm">
              {enforced ? 'Required for your account security' : 'Protect your TheoAgent account'}
            </p>
          </div>

          {canClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
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

          {/* Verify existing MFA */}
          {step === 'verify' && hasActiveMFA && (
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication is Active</h3>
                <p className="text-gray-600">Enter the 6-digit code from your authenticator app to continue.</p>
              </div>

              <div>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full text-center text-2xl font-mono tracking-widest p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={6}
                />
              </div>

              <button
                onClick={verifyMFA}
                disabled={loading || verificationCode.length !== 6}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>
          )}

          {/* Setup MFA */}
          {step === 'setup' && (
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Secure Your Account</h3>
                <p className="text-gray-600">
                  Two-factor authentication adds an extra layer of security by requiring a code from your phone in addition to your password.
                </p>
              </div>

              <div className="space-y-4 text-left">
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Download an Authenticator App</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Install Google Authenticator, Authy, or Microsoft Authenticator on your phone.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Scan QR Code</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Use your authenticator app to scan the QR code we'll show you.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Enter Verification Code</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Enter the 6-digit code from your app to complete setup.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={enrollMFA}
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
              >
                {loading ? 'Setting up...' : 'Start Setup'}
              </button>
            </div>
          )}

          {/* QR Code & Challenge */}
          {step === 'challenge' && qrCode && (
            <div className="text-center space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan QR Code</h3>
                <div className="bg-white p-4 rounded-xl border-2 border-gray-200 inline-block">
                  <img 
                    src={qrCode} 
                    alt="MFA QR Code" 
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Scan this QR code with your authenticator app, then enter the 6-digit code it generates.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <div className="flex space-x-2 justify-center">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <input
                        key={index}
                        ref={el => { inputRefs.current[index] = el }}
                        type="text"
                        value={challengeCode[index] || ''}
                        onChange={(e) => handleCodeInput(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-12 text-center text-xl font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength={1}
                      />
                    ))}
                  </div>
                </div>

                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium mb-1">Can't scan the QR code?</p>
                  <p className="mb-2">Enter this code manually in your authenticator app:</p>
                  <code className="bg-white px-2 py-1 rounded text-gray-800 font-mono break-all">
                    {secret}
                  </code>
                </div>
              </div>

              <button
                onClick={completeMFASetup}
                disabled={loading || challengeCode.length !== 6}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Complete Setup'}
              </button>
            </div>
          )}

          {/* Recovery Codes */}
          {step === 'recovery' && (
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h4a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Save Your Recovery Codes</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="text-left">
                      <p className="text-sm text-yellow-800 font-medium">Important: Save these codes!</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Store these recovery codes in a safe place. You can use them to access your account if you lose your phone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                  {recoveryCodes.map((code, index) => (
                    <div key={index} className="bg-white p-2 rounded border text-center">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={downloadRecoveryCodes}
                  className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download Codes</span>
                </button>

                <button
                  onClick={() => {
                    onSuccess?.()
                    onClose()
                  }}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Complete Setup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}