export type AuthEventType = 
  | 'signup_started'
  | 'signup_completed' 
  | 'signin_started'
  | 'signin_completed'
  | 'signin_failed'
  | 'signout'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'email_verification_sent'
  | 'email_verified'
  | 'social_signin_started'
  | 'social_signin_completed'
  | 'social_signin_failed';

export interface AuthEventData {
  event_type: AuthEventType;
  user_id?: string;
  email?: string;
  provider?: 'google' | 'facebook' | 'github' | 'apple' | 'email';
  user_agent?: string;
  ip_address?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
  url?: string;
  referrer?: string;
}

class AuthAnalytics {
  private async logEvent(eventData: AuthEventData) {
    try {
      // Add browser and system info
      const enrichedData = {
        ...eventData,
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof window !== 'undefined' ? document.referrer : undefined,
      };

      // In a production app, you'd want to send this to your analytics service
      // For now, we'll log to console and optionally store in Supabase
      console.log('🔐 Auth Event:', enrichedData);
      
      // Store in local storage for debugging (optional)
      if (typeof window !== 'undefined') {
        const existingEvents = JSON.parse(localStorage.getItem('auth_events') || '[]');
        existingEvents.push(enrichedData);
        // Keep only last 100 events
        const recentEvents = existingEvents.slice(-100);
        localStorage.setItem('auth_events', JSON.stringify(recentEvents));
      }

      // TODO: Send to analytics service (Google Analytics, Mixpanel, etc.)
      // await this.sendToAnalyticsService(enrichedData);
      
    } catch (error) {
      console.error('Failed to log auth event:', error);
    }
  }

  // Sign up events
  signupStarted(email: string, provider: 'email' | 'google' | 'facebook' | 'github' = 'email') {
    this.logEvent({
      event_type: 'signup_started',
      email,
      provider,
    });
  }

  signupCompleted(userId: string, email: string, provider: 'email' | 'google' | 'facebook' | 'github' = 'email') {
    this.logEvent({
      event_type: 'signup_completed',
      user_id: userId,
      email,
      provider,
    });
  }

  // Sign in events
  signinStarted(email: string, provider: 'email' | 'google' | 'facebook' | 'github' = 'email') {
    this.logEvent({
      event_type: 'signin_started',
      email,
      provider,
    });
  }

  signinCompleted(userId: string, email: string, provider: 'email' | 'google' | 'facebook' | 'github' = 'email') {
    this.logEvent({
      event_type: 'signin_completed',
      user_id: userId,
      email,
      provider,
    });
  }

  signinFailed(email: string, errorMessage: string, provider: 'email' | 'google' | 'facebook' | 'github' = 'email') {
    this.logEvent({
      event_type: 'signin_failed',
      email,
      provider,
      error_message: errorMessage,
    });
  }

  // Sign out events
  signout(userId?: string) {
    this.logEvent({
      event_type: 'signout',
      user_id: userId,
    });
  }

  // Password reset events
  passwordResetRequested(email: string) {
    this.logEvent({
      event_type: 'password_reset_requested',
      email,
    });
  }

  passwordResetCompleted(userId: string, email: string) {
    this.logEvent({
      event_type: 'password_reset_completed',
      user_id: userId,
      email,
    });
  }

  // Email verification events
  emailVerificationSent(email: string) {
    this.logEvent({
      event_type: 'email_verification_sent',
      email,
    });
  }

  emailVerified(userId: string, email: string) {
    this.logEvent({
      event_type: 'email_verified',
      user_id: userId,
      email,
    });
  }

  // Social login events
  socialSigninStarted(provider: 'google' | 'facebook' | 'github' | 'apple') {
    this.logEvent({
      event_type: 'social_signin_started',
      provider,
    });
  }

  socialSigninCompleted(userId: string, email: string, provider: 'google' | 'facebook' | 'github' | 'apple') {
    this.logEvent({
      event_type: 'social_signin_completed',
      user_id: userId,
      email,
      provider,
    });
  }

  socialSigninFailed(provider: 'google' | 'facebook' | 'github' | 'apple', errorMessage: string) {
    this.logEvent({
      event_type: 'social_signin_failed',
      provider,
      error_message: errorMessage,
    });
  }

  // Utility methods for retrieving analytics data
  getStoredEvents(): AuthEventData[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('auth_events') || '[]');
  }

  getEventsByType(eventType: AuthEventType): AuthEventData[] {
    return this.getStoredEvents().filter(event => event.event_type === eventType);
  }

  getEventsByUser(userId: string): AuthEventData[] {
    return this.getStoredEvents().filter(event => event.user_id === userId);
  }

  clearStoredEvents(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_events');
    }
  }

  // Analytics summary for dashboard
  getAnalyticsSummary() {
    const events = this.getStoredEvents();
    const summary = {
      totalEvents: events.length,
      signups: events.filter(e => e.event_type === 'signup_completed').length,
      signins: events.filter(e => e.event_type === 'signin_completed').length,
      failedSignins: events.filter(e => e.event_type === 'signin_failed').length,
      passwordResets: events.filter(e => e.event_type === 'password_reset_requested').length,
      emailVerifications: events.filter(e => e.event_type === 'email_verified').length,
      socialLogins: events.filter(e => e.event_type === 'social_signin_completed').length,
      providerBreakdown: {} as Record<string, number>,
      recentEvents: events.slice(-10).reverse(), // Last 10 events, newest first
    };

    // Calculate provider breakdown
    events.forEach(event => {
      if (event.provider) {
        summary.providerBreakdown[event.provider] = (summary.providerBreakdown[event.provider] || 0) + 1;
      }
    });

    return summary;
  }
}

// Export singleton instance
export const authAnalytics = new AuthAnalytics();

// React hook for using auth analytics in components
export function useAuthAnalytics() {
  return authAnalytics;
}
