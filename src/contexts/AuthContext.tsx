'use client'

import React, { createContext, useContext, ReactNode } from 'react'

interface AuthContextType {
  onSignUp?: () => void
  onSignIn?: () => void
  onSignOut?: () => void
  onPasswordReset?: () => void
  user?: any
  session?: any
}

const AuthContext = createContext<AuthContextType>({})

export const useAuth = () => useContext(AuthContext)

interface AuthProviderProps {
  children: ReactNode
  value: AuthContextType
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, value }) => {
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}