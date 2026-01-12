'use client'

import { useState, useEffect } from 'react'

export default function DatabaseStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    checkDatabaseConnection()
  }, [])

  const checkDatabaseConnection = async () => {
    try {
      const response = await fetch('/api/test-db')
      const data = await response.json()
      
      if (data.success) {
        setStatus('connected')
      } else {
        setStatus('error')
        setErrorMessage(data.error || 'Database connection failed')
      }
    } catch (error) {
      setStatus('error')
      setErrorMessage('Failed to connect to database')
      console.error('Database test error:', error)
    }
  }

  if (status === 'checking') {
    return (
      <div className="flex items-center space-x-2 text-yellow-600">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="text-sm">Checking database...</span>
      </div>
    )
  }

  if (status === 'connected') {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm">Database connected ✅</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 text-red-600">
      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
      <span className="text-sm">Database error ❌</span>
      {errorMessage && (
        <details className="text-xs">
          <summary className="cursor-pointer">Details</summary>
          <p className="mt-1">{errorMessage}</p>
        </details>
      )}
    </div>
  )
}