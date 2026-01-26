import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (will be updated after setting up Supabase)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          institution_name: string | null
          role: string | null
          experience_level: string | null
          interests: string[] | null
          preferred_language: string | null
          onboarding_completed: boolean | null
          subscription_tier: 'free' | 'plus' | 'expert'
          subscription_status: 'active' | 'canceled' | 'past_due'
          usage_count_today: number
          usage_reset_date: string
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          institution_name?: string | null
          role?: string | null
          experience_level?: string | null
          interests?: string[] | null
          preferred_language?: string | null
          onboarding_completed?: boolean | null
          subscription_tier?: 'free' | 'plus' | 'expert'
          subscription_status?: 'active' | 'canceled' | 'past_due'
          usage_count_today?: number
          usage_reset_date?: string
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          institution_name?: string | null
          role?: string | null
          experience_level?: string | null
          interests?: string[] | null
          preferred_language?: string | null
          onboarding_completed?: boolean | null
          subscription_tier?: 'free' | 'plus' | 'expert'
          subscription_status?: 'active' | 'canceled' | 'past_due'
          usage_count_today?: number
          usage_reset_date?: string
          stripe_customer_id?: string | null
        }
      }
      theological_sources: {
        Row: {
          id: string
          title: string
          source_type: 'catechism' | 'papal' | 'biblical' | 'patristic' | 'conciliar'
          content: string
          language: string
          citations: string[]
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          title: string
          source_type: 'catechism' | 'papal' | 'biblical' | 'patristic' | 'conciliar'
          content: string
          language?: string
          citations?: string[]
          tags?: string[]
        }
        Update: {
          title?: string
          source_type?: 'catechism' | 'papal' | 'biblical' | 'patristic' | 'conciliar'
          content?: string
          language?: string
          citations?: string[]
          tags?: string[]
        }
      }
      daily_gospel_readings: {
        Row: {
          id: string
          date: string
          reading_text: string
          gospel_reference: string
          liturgical_season: string
          created_at: string
        }
        Insert: {
          date: string
          reading_text: string
          gospel_reference: string
          liturgical_season?: string
        }
        Update: {
          date?: string
          reading_text?: string
          gospel_reference?: string
          liturgical_season?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          mode_used: string
          message_count: number
          created_at: string
        }
        Insert: {
          user_id: string
          mode_used: string
          message_count?: number
        }
        Update: {
          mode_used?: string
          message_count?: number
        }
      }
      donations: {
        Row: {
          id: string
          user_id: string | null
          payment_provider: 'stripe' | 'paypal' | 'mercadopago'
          payment_id: string
          session_id: string | null
          amount_cents: number
          currency: string
          status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
          donor_email: string | null
          donor_name: string | null
          message: string | null
          is_anonymous: boolean
          metadata: Record<string, unknown>
          webhook_verified: boolean
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          user_id?: string | null
          payment_provider: 'stripe' | 'paypal' | 'mercadopago'
          payment_id: string
          session_id?: string | null
          amount_cents: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
          donor_email?: string | null
          donor_name?: string | null
          message?: string | null
          is_anonymous?: boolean
          metadata?: Record<string, unknown>
          webhook_verified?: boolean
        }
        Update: {
          user_id?: string | null
          payment_provider?: 'stripe' | 'paypal'
          payment_id?: string
          session_id?: string | null
          amount_cents?: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
          donor_email?: string | null
          donor_name?: string | null
          message?: string | null
          is_anonymous?: boolean
          metadata?: Record<string, unknown>
          webhook_verified?: boolean
          completed_at?: string | null
        }
      }
      email_subscriptions: {
        Row: {
          email: string
          language: string
          subscribed_at: string
          preferences: {
            newsletter: boolean
            xp_tracking: boolean
            chat_history: boolean
            new_features: boolean
          } | null
        }
        Insert: {
          email: string
          language?: string
          subscribed_at?: string
          preferences?: {
            newsletter: boolean
            xp_tracking: boolean
            chat_history: boolean
            new_features: boolean
          } | null
        }
        Update: {
          email?: string
          language?: string
          subscribed_at?: string
          preferences?: {
            newsletter: boolean
            xp_tracking: boolean
            chat_history: boolean
            new_features: boolean
          } | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_usage: {
        Args: { user_id: string }
        Returns: void
      }
      reset_daily_usage: {
        Args: Record<string, never>
        Returns: void
      }
    }
    Enums: {
      subscription_tier: 'free' | 'plus' | 'expert'
      subscription_status: 'active' | 'canceled' | 'past_due'
      source_type: 'catechism' | 'papal' | 'biblical' | 'patristic' | 'conciliar'
      payment_provider: 'stripe' | 'paypal' | 'mercadopago'
      donation_status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
    }
  }
}
