export type SubscriptionTier = 'free' | 'plus' | 'expert';

export interface SubscriptionLimits {
  maxMessagesPerDay: number;
  maxResponseTokens: number;
  availableModes: string[];
  model: string;
  temperature: number;
  academicFeatures: boolean;
  priority: boolean;
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    maxMessagesPerDay: 10,
    maxResponseTokens: 1000, // Short responses
    availableModes: ['standard'],
    model: 'claude-3-haiku-20240307', // Cheaper, faster model
    temperature: 0.7,
    academicFeatures: false,
    priority: false,
  },
  plus: {
    maxMessagesPerDay: 100,
    maxResponseTokens: 8000, // Full responses
    availableModes: ['standard', 'deep-research', 'priest', 'pope'],
    model: 'claude-sonnet-4-20250514', // Premium model
    temperature: 0.9,
    academicFeatures: false,
    priority: true,
  },
  expert: {
    maxMessagesPerDay: 500, // Institution usage
    maxResponseTokens: 16000, // Extended academic responses
    availableModes: ['standard', 'deep-research', 'priest', 'pope', 'academic-expert'],
    model: 'claude-sonnet-4-20250514',
    temperature: 0.9,
    academicFeatures: true,
    priority: true,
  },
};

export interface UserSubscription {
  userId: string;
  tier: SubscriptionTier;
  messagesUsedToday: number;
  resetDate: string;
  institutionName?: string;
  subscriptionEnd?: string;
}

// Mock user subscription - in production, this would come from database
export function getUserSubscription(userId: string = 'default'): UserSubscription {
  // For now, return free tier for demonstration
  // In production, this would query your database
  return {
    userId,
    tier: 'free',
    messagesUsedToday: 0,
    resetDate: new Date().toISOString().split('T')[0],
  };
}

export function canUserAccessMode(subscription: UserSubscription, mode: string): boolean {
  const limits = SUBSCRIPTION_TIERS[subscription.tier];
  return limits.availableModes.includes(mode);
}

export function hasReachedDailyLimit(subscription: UserSubscription): boolean {
  const limits = SUBSCRIPTION_TIERS[subscription.tier];
  return subscription.messagesUsedToday >= limits.maxMessagesPerDay;
}

export function getUpgradeMessage(currentTier: SubscriptionTier, requestedFeature: string): string {
  const messages = {
    free: {
      mode: "🔒 This mode requires TheoAgent Plus. Upgrade to access all 4 response modes and longer, detailed theological responses.",
      limit: "📊 Daily limit reached (10 messages). Upgrade to TheoAgent Plus for 100+ messages per day.",
    },
    plus: {
      academic: "🎓 Academic Expert features require TheoAgent Expert. Contact us for institutional pricing.",
    }
  };

  if (currentTier === 'free') {
    return messages.free[requestedFeature as keyof typeof messages.free] || messages.free.mode;
  } else if (currentTier === 'plus') {
    return messages.plus.academic;
  }
  
  return "Upgrade required for this feature.";
}

export const PRICING_INFO = {
  plus: {
    monthly: 19.99,
    yearly: 199.99,
    target: "Individual priests, seminarians, theology students",
    features: [
      "All 4 response modes (Standard, Deep Research, Priest, Pope)",
      "Full-length detailed responses (up to 8,000 tokens)",
      "100+ messages per day",
      "Priority processing",
      "Multilingual support",
      "Advanced citation system",
    ]
  },
  expert: {
    monthly: 149.99,
    yearly: 1499.99,
    target: "Seminaries, universities, dioceses, theology schools",
    features: [
      "Everything in Plus",
      "Academic Expert mode with research tools",
      "500+ messages per day per institution",
      "Extended responses (up to 16,000 tokens)",
      "Institution branding options",
      "Bulk user management",
      "Priority support",
      "Custom integrations available",
    ]
  }
};