'use client'

import { useState } from 'react'
import { type User } from '@supabase/supabase-js'

interface OnboardingFlowProps {
  user: User
  onComplete: () => void
  onSkip?: () => void
}

interface OnboardingData {
  role: 'priest' | 'religious' | 'layperson' | ''
  profession: 'student' | 'educator' | 'theologian' | 'catechist' | 'seeker' | ''
  interests: string[]
  preferredLanguage: 'en' | 'es' | 'pt'
}

type RoleId = OnboardingData['role']
type ProfessionId = OnboardingData['profession']

const ROLE_OPTIONS: Array<{
  id: RoleId
  name: string
  description: string
  icon: string
}> = [
  { id: 'layperson', name: 'Laico', description: 'Fiel católico en el mundo', icon: '🙏' },
  { id: 'priest', name: 'Sacerdote', description: 'Ministro ordenado', icon: '✝️' },
  { id: 'religious', name: 'Religioso/a', description: 'Vida consagrada', icon: '📿' }
]

const PROFESSION_OPTIONS: Array<{
  id: ProfessionId
  name: string
  description: string
  icon: string
}> = [
  { id: 'student', name: 'Estudiante', description: 'Estudiante de teología o seminario', icon: '🎓' },
  { id: 'catechist', name: 'Catequista', description: 'Formador en la fe', icon: '📖' },
  { id: 'educator', name: 'Educador', description: 'Profesor o maestro católico', icon: '👨‍🏫' },
  { id: 'theologian', name: 'Teólogo', description: 'Investigador o académico', icon: '📚' },
  { id: 'seeker', name: 'Buscador', description: 'Interesado en aprender más', icon: '🔍' }
]

const INTEREST_OPTIONS = [
  'Sagradas Escrituras', 'Padres de la Iglesia', 'Catecismo', 'Teología Moral', 
  'Liturgia y Sacramentos', 'Mariología', 'Santos y Espiritualidad', 'Historia de la Iglesia',
  'Doctrina Social', 'Apologética', 'Exégesis Bíblica', 'Teología Dogmática'
]

export default function OnboardingFlow({ user, onComplete, onSkip }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<OnboardingData>({
    role: '',
    profession: '',
    interests: [],
    preferredLanguage: 'es'
  })

  const totalSteps = 3

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    setError('')

    try {
      // Generate or retrieve guest ID
      let guestId = localStorage.getItem('santapalabra_guest_id');
      if (!guestId) {
        guestId = crypto.randomUUID();
        localStorage.setItem('santapalabra_guest_id', guestId);
      }

      const profileData = {
        id: guestId,
        role: data.role,
        experience_level: data.profession, // Mapping profession to experience_level for compatibility
        interests: data.interests,
        preferred_language: data.preferredLanguage,
        // subscription_tier: 'free', // Removed as it's not in the schema
        onboarding_completed: true,
        metadata: {
          profession: data.profession,
          subscription_tier: 'free'
          // topics: data.topics, // Removed
          // notifications: data.notifications // Removed
        }
      };

      // Save to Guest API
      const response = await fetch('/api/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('API Error Details:', errData);
        throw new Error(errData.error || 'Failed to save guest profile');
      }

      // Save to localStorage for client-side access (HomePage compatibility)
      localStorage.setItem('santapalabra_profile', JSON.stringify(profileData));
      
      onComplete()

    } catch (error: unknown) {
      console.error('Onboarding save error:', error)
      setError('Failed to save preferences. Please try again.')
      // Even if API fails, we can save locally and proceed
      try {
         const guestId = localStorage.getItem('santapalabra_guest_id') || crypto.randomUUID();
         localStorage.setItem('santapalabra_guest_id', guestId);
         
         const localProfile = {
             id: guestId,
             role: data.role,
             experience_level: data.profession,
             interests: data.interests,
             preferred_language: data.preferredLanguage,
             subscription_tier: 'free',
             onboarding_completed: true,
             metadata: {
               profession: data.profession
             }
          };
         localStorage.setItem('santapalabra_profile', JSON.stringify(localProfile));
         setTimeout(() => onComplete(), 1000);
      } catch (e) {
         console.error('Local save error:', e);
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleArrayItem = <T,>(array: T[], item: T, max?: number): T[] => {
    const newArray = array.includes(item) 
      ? array.filter(i => i !== item)
      : max && array.length >= max 
        ? array 
        : [...array, item]
    return newArray
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return data.role !== ''
      case 2: return data.profession !== ''
      case 3: return data.interests.length > 0
      default: return true
    }
  }

  return (
    <div className="fixed inset-0 bg-linear-to-br from-blue-50 via-yellow-50 to-amber-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-200 bg-linear-to-r from-[#F4B400] to-[#FFCC00] flex-none">
          <div className="text-center text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-3xl">⛪</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">¡Bienvenido a Santa Palabra!</h1>
            <p className="text-white/90">Personalicemos tu asistente teológico</p>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-white/80 mb-2">
              <span>Paso {currentStep} de {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% completado</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Skip button */}
          {onSkip && (
            <button
              onClick={onSkip}
              className="absolute top-4 right-4 text-white/80 hover:text-white text-sm underline"
            >
              Saltar configuración
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Step 1: Role Selection */}
          {currentStep === 1 && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¿Cuál es tu estado de vida?</h2>
              <p className="text-gray-600 mb-8">Ayúdanos a personalizar tu experiencia</p>
              
              <div className="space-y-3">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setData(prev => ({ ...prev, role: role.id }))}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left hover:shadow-md ${
                      data.role === role.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{role.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{role.name}</h3>
                        <p className="text-sm text-gray-600">{role.description}</p>
                      </div>
                      {data.role === role.id && (
                        <div className="ml-auto">
                          <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Profession/Occupation */}
          {currentStep === 2 && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¿Cuál es tu perfil?</h2>
              <p className="text-gray-600 mb-8">Para ofrecerte contenido relevante</p>
              
              <div className="space-y-3">
                {PROFESSION_OPTIONS.map((prof) => (
                  <button
                    key={prof.id}
                    onClick={() => setData(prev => ({ ...prev, profession: prof.id }))}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left hover:shadow-md ${
                      data.profession === prof.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{prof.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{prof.name}</h3>
                        <p className="text-sm text-gray-600">{prof.description}</p>
                      </div>
                      {data.profession === prof.id && (
                        <div className="ml-auto">
                          <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Interests */}
          {currentStep === 3 && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¿Qué te interesa más?</h2>
              <p className="text-gray-600 mb-8">Selecciona hasta 6 áreas</p>
              
              <div className="grid grid-cols-2 gap-3">
                {INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => setData(prev => ({ 
                      ...prev, 
                      interests: toggleArrayItem(prev.interests, interest, 6) 
                    }))}
                    className={`p-3 rounded-xl border-2 transition-all text-sm hover:shadow-sm ${
                      data.interests.includes(interest)
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
              
              <p className="text-xs text-gray-500 mt-4">
                Seleccionado: {data.interests.length}/6
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-none">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Atrás</span>
            </button>

            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index + 1 <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={!isStepValid() || loading}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Configurando...</span>
                </>
              ) : currentStep === totalSteps ? (
                <span>Completar</span>
              ) : (
                <>
                  <span>Siguiente</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
