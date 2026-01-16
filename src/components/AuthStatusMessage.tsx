'use client'

import { useSearchParams } from 'next/navigation'

export default function AuthStatusMessage() {
  const searchParams = useSearchParams()
  const messageParam = searchParams.get('message')

  let message: string | null = null
  let type: 'success' | 'info' | 'warning' = 'info'

  switch (messageParam) {
    case 'auth_success':
      message = 'Successfully signed in! Welcome to santaPalabra.'
      type = 'success'
      break
    case 'email_confirmed':
      message = 'Email confirmed successfully! You can now use all features.'
      type = 'success'
      break
    case 'password_reset_success':
      message = 'Password reset successful! Please set your new password.'
      type = 'info'
      break
    default:
      message = null
  }

  if (!message) return null

  const bgColor = {
    success: 'bg-green-100 border-green-400 text-green-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700'
  }[type]

  const handleClose = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('message')
    window.history.replaceState({}, '', url.toString())
  }

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${bgColor} px-6 py-4 rounded-lg border shadow-lg max-w-md w-full mx-4`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={handleClose}
          className="ml-4 text-current opacity-60 hover:opacity-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
