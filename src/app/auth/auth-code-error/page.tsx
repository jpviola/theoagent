'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const description = searchParams.get('description')

  const getErrorInfo = (errorType: string | null) => {
    switch (errorType) {
      case 'access_denied':
        return {
          title: 'Access Denied',
          message: 'You cancelled the authentication process or denied access.',
          suggestions: ['Try signing in again', 'Use a different authentication method']
        }
      case 'code_exchange_failed':
        return {
          title: 'Authentication Failed',
          message: 'There was an error processing your authentication.',
          suggestions: ['Clear your browser cache and try again', 'Try using an incognito/private window']
        }
      case 'no_code_provided':
        return {
          title: 'Invalid Authentication Link',
          message: 'The authentication link is missing required information.',
          suggestions: ['Request a new authentication link', 'Try signing in directly']
        }
      case 'unexpected_error':
        return {
          title: 'Unexpected Error',
          message: 'An unexpected error occurred during authentication.',
          suggestions: ['Try again in a few minutes', 'Contact support if the problem persists']
        }
      default:
        return {
          title: 'Authentication Error',
          message: 'There was an error with the authentication process.',
          suggestions: ['Expired or invalid authentication link', 'Network connectivity issues', 'Browser security restrictions']
        }
    }
  }

  const errorInfo = getErrorInfo(error)

  return (
    <div className="min-h-screen bg-linear-to-t from-[#a4becf] via-[#d0dce6] to-[#f0f4f7] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{errorInfo.title}</h1>
        
        <p className="text-gray-600 mb-6">{errorInfo.message}</p>
        
        {description && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 font-mono break-all">{description}</p>
          </div>
        )}
        
        <div className="text-left mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">What you can try:</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            {errorInfo.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2 mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="w-full block bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors"
          >
            Return to santaPalabra
          </Link>
          
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
          >
            Try Again
          </button>
          
          {error === 'access_denied' && (
            <Link
              href="/?auth=signin"
              className="w-full block bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-medium transition-colors"
            >
              Sign In Directly
            </Link>
          )}
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Error Code: {error || 'UNKNOWN'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            If the problem persists, please contact our support team with this error code.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-(--background) text-(--foreground) flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
