import { supabase } from './supabase'
import type { Database } from './supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

export interface SubscriptionTier {
  id: 'free' | 'plus' | 'expert'
  name: string
  price: number
  currency: string
  interval: string
  features: string[]
  limits: {
    dailyMessages: number
    modesAccess: string[]
    supportLevel: string
    storageGB: number
  }
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  free: {
    id: 'free',
    name: 'Free Tier',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      '10 daily theological consultations',
      'Standard response mode only',
      'Basic scripture references',
      'Community support forum'
    ],
    limits: {
      dailyMessages: 10,
      modesAccess: ['standard'],
      supportLevel: 'community',
      storageGB: 0.1
    }
  },
  plus: {
    id: 'plus',
    name: 'Plus Subscription',
    price: 19.99,
    currency: 'USD',
    interval: 'month',
    features: [
      '100 daily theological consultations',
      'All response modes (Standard, Deep Research, Priest)',
      'Advanced scripture cross-references',
      'Priority email support',
      'Export conversations to PDF',
      'Multilingual support (EN/ES/IT/FR)'
    ],
    limits: {
      dailyMessages: 100,
      modesAccess: ['standard', 'deep-research', 'priest'],
      supportLevel: 'email',
      storageGB: 1
    }
  },
  expert: {
    id: 'expert',
    name: 'Expert Subscription',
    price: 49.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Unlimited theological consultations',
      'All response modes including "Papal Mode"',
      'Complete magisterial document access',
      '24/7 priority support',
      'Advanced theological research tools',
      'Institution-wide licensing available',
      'Custom theological document uploads',
      'API access for integration'
    ],
    limits: {
      dailyMessages: -1, // unlimited
      modesAccess: ['standard', 'deep-research', 'priest', 'pope', 'academic-expert'],
      supportLevel: '24/7',
      storageGB: 10
    }
  }
}

export const PRICING_INFO = {
  currency: 'USD',
  tiers: Object.values(SUBSCRIPTION_TIERS),
  annualDiscount: 0.2, // 20% discount for annual billing
  institutionalDiscount: 0.15 // 15% discount for institutions
}

// Database-backed subscription functions
export async function getUserSubscription(userId: string): Promise<Profile | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching subscription:', error)
    return null
  }
  
  return profile
}

export async function updateSubscription(
  userId: string, 
  tier: 'free' | 'plus' | 'expert',
  status: 'active' | 'canceled' | 'past_due' = 'active',
  stripeCustomerId?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: tier,
      subscription_status: status,
      stripe_customer_id: stripeCustomerId,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
  
  if (error) {
    console.error('Error updating subscription:', error)
    return false
  }
  
  return true
}

export async function checkSubscriptionAccess(
  userId: string,
  requiredTier: 'free' | 'plus' | 'expert'
): Promise<{ hasAccess: boolean, currentTier: string, reason?: string }> {
  const profile = await getUserSubscription(userId)
  
  if (!profile) {
    return { hasAccess: false, currentTier: 'none', reason: 'No profile found' }
  }
  
  if (profile.subscription_status !== 'active') {
    return { 
      hasAccess: false, 
      currentTier: profile.subscription_tier, 
      reason: 'Subscription not active' 
    }
  }
  
  const tierHierarchy = { free: 0, plus: 1, expert: 2 }
  const userTierLevel = tierHierarchy[profile.subscription_tier as keyof typeof tierHierarchy]
  const requiredTierLevel = tierHierarchy[requiredTier]
  
  return {
    hasAccess: userTierLevel >= requiredTierLevel,
    currentTier: profile.subscription_tier,
    reason: userTierLevel < requiredTierLevel ? 'Insufficient subscription tier' : undefined
  }
}

export async function checkUsageLimit(userId: string): Promise<{
  canUse: boolean
  currentUsage: number
  dailyLimit: number
  resetTime: string
}> {
  const profile = await getUserSubscription(userId)
  
  if (!profile) {
    return {
      canUse: false,
      currentUsage: 0,
      dailyLimit: 0,
      resetTime: new Date().toISOString()
    }
  }
  
  const tier = SUBSCRIPTION_TIERS[profile.subscription_tier]
  const dailyLimit = tier.limits.dailyMessages
  
  // Check if we need to reset usage (new day)
  const today = new Date().toDateString()
  const resetDate = new Date(profile.usage_reset_date).toDateString()
  
  if (today !== resetDate) {
    // Reset usage for new day
    await supabase
      .from('profiles')
      .update({
        usage_count_today: 0,
        usage_reset_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', userId)
    
    return {
      canUse: true,
      currentUsage: 0,
      dailyLimit,
      resetTime: new Date().toISOString()
    }
  }
  
  return {
    canUse: dailyLimit === -1 || profile.usage_count_today < dailyLimit,
    currentUsage: profile.usage_count_today,
    dailyLimit,
    resetTime: profile.usage_reset_date
  }
}

export async function incrementUsage(userId: string): Promise<boolean> {
  // Get current usage first
  const { data: profile } = await supabase
    .from('profiles')
    .select('usage_count_today')
    .eq('id', userId)
    .single();
  
  if (!profile) return false;
  
  const { error } = await supabase
    .from('profiles')
    .update({
      usage_count_today: profile.usage_count_today + 1
    })
    .eq('id', userId);
  
  if (error) {
    console.error('Error incrementing usage:', error)
    return false
  }
  
  return true
}

export async function createConversationRecord(
  userId: string,
  mode: string,
  messageCount: number = 1
): Promise<boolean> {
  const { error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      mode_used: mode,
      message_count: messageCount
    })
  
  if (error) {
    console.error('Error creating conversation record:', error)
    return false
  }
  
  return true
}