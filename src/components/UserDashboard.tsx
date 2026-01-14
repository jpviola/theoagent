'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import type { Database } from '@/lib/supabase'
import { SUBSCRIPTION_TIERS } from '@/lib/subscription-db'
import ConversationManager from './ConversationManager'

interface UserProfile {
  id: string
  full_name: string | null
  institution_name: string | null
  subscription_tier: 'free' | 'plus' | 'expert'
  subscription_status: 'active' | 'canceled' | 'past_due'
  usage_count_today: number
  usage_reset_date: string
}

interface UserDashboardProps {
  onShowPricing: () => void
}

export default function UserDashboard({ onShowPricing }: UserDashboardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
      } else {
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Error in loadProfile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const currentTier = SUBSCRIPTION_TIERS[profile.subscription_tier]
  const usagePercentage = currentTier.limits.dailyMessages === -1 
    ? 0 
    : (profile.usage_count_today / currentTier.limits.dailyMessages) * 100

  const isNearLimit = usagePercentage > 80
  const isAtLimit = profile.usage_count_today >= currentTier.limits.dailyMessages && currentTier.limits.dailyMessages !== -1

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
      {/* User Info Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg text-gray-800 dark:text-white">
            {profile.full_name || 'User'}
          </h3>
          <button
            onClick={handleSignOut}
            className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400"
          >
            Sign out
          </button>
        </div>
        {profile.institution_name && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{profile.institution_name}</p>
        )}
      </div>

      {/* Subscription Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Plan</span>
          {profile.subscription_tier !== 'free' && (
            <span className={`px-2 py-1 text-xs rounded-full ${
              profile.subscription_status === 'active'
                ? 'bg-green-100 text-green-800'
                : profile.subscription_status === 'past_due'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {profile.subscription_status}
            </span>
          )}
        </div>
        <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-gray-800 dark:text-white">{currentTier.name}</span>
            {profile.subscription_tier !== 'expert' && (
              <button
                onClick={onShowPricing}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium dark:text-blue-300"
              >
                Upgrade
              </button>
            )}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            ${currentTier.price}/{currentTier.interval}
          </p>
        </div>
      </div>

      {/* Usage Tracking */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Usage</span>
          <span className={`text-sm ${isAtLimit ? 'text-red-600 font-semibold' : isNearLimit ? 'text-yellow-600' : 'text-gray-600'}`}>
            {profile.usage_count_today}{currentTier.limits.dailyMessages === -1 ? '' : `/${currentTier.limits.dailyMessages}`}
          </span>
        </div>
        
        {currentTier.limits.dailyMessages !== -1 ? (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2 dark:bg-gray-700">
            <div
              className={`h-2 rounded-full ${
                isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        ) : (
          <div className="text-xs text-green-600 font-medium mb-2">✨ Unlimited usage</div>
        )}

        {isAtLimit && (
          <div className="bg-red-50 border border-red-200 rounded p-2 mb-2 dark:bg-red-900 dark:border-red-700">
            <p className="text-xs text-red-700 dark:text-red-300">
              Daily limit reached! Upgrade to continue using santaPalabra.
            </p>
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Resets daily at midnight UTC
        </p>
      </div>

      {/* Available Features */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Available Features</h4>
        <ul className="space-y-1">
          {currentTier.features.slice(0, 3).map((feature, index) => (
            <li key={index} className="text-xs text-gray-600 flex items-start dark:text-gray-300">
              <span className="text-green-500 mr-1">✓</span>
              <span>{feature}</span>
            </li>
          ))}
          {currentTier.features.length > 3 && (
            <li className="text-xs text-gray-500 dark:text-gray-400">
              +{currentTier.features.length - 3} more features
            </li>
          )}
        </ul>
      </div>

      {/* Response Modes Access */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Response Modes</h4>
        <div className="space-y-1">
          {[
            { id: 'standard', name: 'Standard', icon: '📖' },
            { id: 'deep-research', name: 'Deep Research', icon: '🔍' },
            { id: 'priest', name: 'Priest Mode', icon: '⛪' },
            { id: 'pope', name: 'Papal Mode', icon: '👑' },
            { id: 'academic-expert', name: 'Academic Expert', icon: '🎓' }
          ].map(mode => {
            const hasAccess = currentTier.limits.modesAccess.includes(mode.id)
            return (
              <div key={mode.id} className={`flex items-center text-xs ${
                hasAccess ? 'text-gray-700' : 'text-gray-400'
              }`}>
                <span className="mr-2">{mode.icon}</span>
                <span className={hasAccess ? '' : 'line-through'}>{mode.name}</span>
                {hasAccess && <span className="ml-auto text-green-500">✓</span>}
                {!hasAccess && <span className="ml-auto text-gray-400">🔒</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* LangChain Conversation Manager */}
      <div className="mb-6">
        <ConversationManager userId={profile.id} />
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        {profile.subscription_tier === 'free' && (
          <button
            onClick={onShowPricing}
            className="w-full bg-blue-600 text-white text-sm py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Upgrade Now
          </button>
        )}
        
        <button className="w-full bg-gray-100 text-gray-700 text-sm py-2 px-4 rounded-md hover:bg-gray-200 transition-colors">
          View Usage History
        </button>
        
        <button className="w-full bg-gray-100 text-gray-700 text-sm py-2 px-4 rounded-md hover:bg-gray-200 transition-colors">
          Settings
        </button>
      </div>

      {/* Support Link */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Need help? Contact our{' '}
          <a href="mailto:support@santapalabra.ai" className="text-blue-600 hover:underline">
            {currentTier.limits.supportLevel} support
          </a>
        </p>
      </div>
    </div>
  )
}