'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

interface OnboardingFlowProps {
  user: any
  onComplete: () => void
  onSkip?: () => void
}

interface OnboardingData {
  role: 'student' | 'educator' | 'priest' | 'scholar' | 'layperson' | ''
  interests: string[]
  experience: 'beginner' | 'intermediate' | 'advanced' | ''
  primaryUse: 'personal_study' | 'teaching' | 'pastoral_care' | 'academic_research' | 'general' | ''
  topics: string[]
  preferredLanguage: 'en' | 'es' | 'it' | 'fr' | 'pt' | ''
  notifications: {
    dailyReflections: boolean
    weeklyNewsletter: boolean
    productUpdates: boolean
  }
}

const ROLE_OPTIONS = [
  { id: 'student', name: 'Student', description: 'Seminary student or theology student', icon: '🎓' },
  { id: 'educator', name: 'Educator', description: 'Teacher, professor, or catechist', icon: '👨‍🏫' },
  { id: 'priest', name: 'Priest/Religious', description: 'Ordained minister or religious', icon: '👨‍💼' },
  { id: 'scholar', name: 'Scholar', description: 'Academic researcher or theologian', icon: '📚' },
  { id: 'layperson', name: 'Lay Faithful', description: 'Faithful seeking to deepen faith', icon: '🙏' }
]

const INTEREST_OPTIONS = [
  'Sacred Scripture', 'Church Fathers', 'Catechism', 'Moral Theology', 
  'Liturgy & Sacraments', 'Mariology', 'Saints & Spirituality', 'Church History',
  'Social Teaching', 'Apologetics', 'Biblical Exegesis', 'Dogmatic Theology'
]

const TOPIC_OPTIONS = [
  'Daily Gospel Readings', 'Saint of the Day', 'Papal Teaching', 'Conciliar Documents',
  'Prayer & Spirituality', 'Bioethics', 'Marriage & Family', 'Social Justice',
  'Ecumenism', 'Interfaith Dialogue', 'Church Law (Canon Law)', 'Theology of the Body'
]

export default function OnboardingFlow({ user, onComplete, onSkip }: OnboardingFlowProps) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<OnboardingData>({
    role: '',
    interests: [],
    experience: '',
    primaryUse: '',
    topics: [],
    preferredLanguage: 'en',
    notifications: {
      dailyReflections: true,
      weeklyNewsletter: true,
      productUpdates: false
    }
  })

  const totalSteps = 5

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
      // Save onboarding data to user profile
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          onboarding_completed: true,
          onboarding_data: data,
          role: data.role,
          experience_level: data.experience,
          interests: data.interests,
          preferred_language: data.preferredLanguage
        }
      })

      if (updateError) throw updateError

      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: data.role,
          experience_level: data.experience,
          interests: data.interests,
          preferred_language: data.preferredLanguage,
          onboarding_completed: true
        })
        .eq('id', user.id)

      if (profileError) {
        console.error('Profile update error:', profileError)
        // Don't throw - onboarding data is saved in auth metadata
      }

      onComplete()

    } catch (error: any) {
      console.error('Onboarding save error:', error)
      setError('Failed to save onboarding data. You can complete this later in settings.')
      setTimeout(() => onComplete(), 2000)
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
      case 2: return data.interests.length > 0
      case 3: return data.experience !== '' && data.primaryUse !== ''
      case 4: return data.topics.length > 0
      case 5: return data.preferredLanguage !== ''
      default: return true
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-yellow-50 to-amber-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-200 bg-gradient-to-r from-[#F4B400] to-[#FFCC00]">
          <div className="text-center text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-3xl">⛪</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Welcome to TheoAgent!</h1>
            <p className="text-white/90">Let's personalize your theological assistant</p>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-white/80 mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% complete</span>
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
              Skip setup
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Step 1: Role Selection */}
          {currentStep === 1 && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your role?</h2>
              <p className="text-gray-600 mb-8">This helps us tailor TheoAgent to your needs</p>
              
              <div className="space-y-3">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setData(prev => ({ ...prev, role: role.id as any }))}
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

          {/* Step 2: Interests */}
          {currentStep === 2 && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What interests you most?</h2>
              <p className="text-gray-600 mb-8">Select up to 6 areas (you can change these later)</p>
              
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
                Selected: {data.interests.length}/6
              </p>
            </div>
          )}

          {/* Step 3: Experience & Usage */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about yourself</h2>
                <p className="text-gray-600 mb-8">This helps us match our responses to your level</p>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Your theology background:</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: 'beginner', name: 'Beginner', desc: 'New to formal theological study' },
                        { id: 'intermediate', name: 'Intermediate', desc: 'Some theological education or experience' },
                        { id: 'advanced', name: 'Advanced', desc: 'Extensive theological training or study' }
                      ].map((level) => (
                        <button
                          key={level.id}
                          onClick={() => setData(prev => ({ ...prev, experience: level.id as any }))}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            data.experience === level.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{level.name}</h4>
                              <p className="text-sm text-gray-600">{level.desc}</p>
                            </div>
                            {data.experience === level.id && (
                              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary use case:</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: 'personal_study', name: 'Personal Study', desc: 'Growing in faith and knowledge' },
                        { id: 'teaching', name: 'Teaching & Education', desc: 'Preparing lessons or courses' },
                        { id: 'pastoral_care', name: 'Pastoral Care', desc: 'Ministry and spiritual guidance' },
                        { id: 'academic_research', name: 'Academic Research', desc: 'Scholarly work and writing' },
                        { id: 'general', name: 'General Questions', desc: 'Various theological inquiries' }
                      ].map((use) => (
                        <button
                          key={use.id}
                          onClick={() => setData(prev => ({ ...prev, primaryUse: use.id as any }))}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            data.primaryUse === use.id
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{use.name}</h4>
                              <p className="text-sm text-gray-600">{use.desc}</p>
                            </div>
                            {data.primaryUse === use.id && (
                              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Specific Topics */}
          {currentStep === 4 && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What topics interest you?</h2>
              <p className="text-gray-600 mb-8">Select areas you'd like to explore (optional but helpful)</p>
              
              <div className="grid grid-cols-2 gap-3">
                {TOPIC_OPTIONS.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setData(prev => ({ 
                      ...prev, 
                      topics: toggleArrayItem(prev.topics, topic, 8) 
                    }))}
                    className={`p-3 rounded-xl border-2 transition-all text-sm hover:shadow-sm ${
                      data.topics.includes(topic)
                        ? 'border-purple-500 bg-purple-50 text-purple-900'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
              
              <p className="text-xs text-gray-500 mt-4">
                Selected: {data.topics.length}/8
              </p>
            </div>
          )}

          {/* Step 5: Language & Notifications */}
          {currentStep === 5 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Final preferences</h2>
                <p className="text-gray-600 mb-8">Choose your language and notification preferences</p>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Preferred Language:</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'en', name: 'English', flag: '🇺🇸' },
                        { id: 'es', name: 'Español', flag: '🇪🇸' },
                        { id: 'it', name: 'Italiano', flag: '🇮🇹' },
                        { id: 'fr', name: 'Français', flag: '🇫🇷' },
                        { id: 'pt', name: 'Português', flag: '🇵🇹' }
                      ].map((lang) => (
                        <button
                          key={lang.id}
                          onClick={() => setData(prev => ({ ...prev, preferredLanguage: lang.id as any }))}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            data.preferredLanguage === lang.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-2xl">{lang.flag}</span>
                          <div className="font-medium text-gray-900">{lang.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Email Notifications:</h3>
                    <div className="space-y-3">
                      {[
                        { 
                          key: 'dailyReflections' as keyof typeof data.notifications, 
                          name: 'Daily Gospel Reflections', 
                          desc: 'Brief theological insights on daily Mass readings' 
                        },
                        { 
                          key: 'weeklyNewsletter' as keyof typeof data.notifications, 
                          name: 'Weekly Newsletter', 
                          desc: 'New features, theological insights, and community highlights' 
                        },
                        { 
                          key: 'productUpdates' as keyof typeof data.notifications, 
                          name: 'Product Updates', 
                          desc: 'Important updates and new feature announcements' 
                        }
                      ].map((notification) => (
                        <div key={notification.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                          <div className="text-left">
                            <h4 className="font-medium text-gray-900">{notification.name}</h4>
                            <p className="text-sm text-gray-600">{notification.desc}</p>
                          </div>
                          <button
                            onClick={() => setData(prev => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                [notification.key]: !prev.notifications[notification.key]
                              }
                            }))}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              data.notifications[notification.key] ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                data.notifications[notification.key] ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
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
                  <span>Setting up...</span>
                </>
              ) : currentStep === totalSteps ? (
                <span>Complete Setup</span>
              ) : (
                <>
                  <span>Next</span>
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