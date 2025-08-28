export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      polls: {
        Row: {
          id: string
          title: string
          description: string | null
          options: Json
          creator_id: string
          is_public: boolean
          allows_multiple_votes: boolean
          expires_at: string | null
          qr_code_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          options: Json
          creator_id: string
          is_public?: boolean
          allows_multiple_votes?: boolean
          expires_at?: string | null
          qr_code_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          options?: Json
          creator_id?: string
          is_public?: boolean
          allows_multiple_votes?: boolean
          expires_at?: string | null
          qr_code_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          poll_id: string
          user_id: string
          option_ids: number[]
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          user_id: string
          option_ids: number[]
          created_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          user_id?: string
          option_ids?: number[]
          created_at?: string
        }
      }
      poll_analytics: {
        Row: {
          id: string
          poll_id: string
          event_type: string
          user_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          event_type: string
          user_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          event_type?: string
          user_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Poll = Database['public']['Tables']['polls']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
