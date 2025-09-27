// lib/types.ts

// For profiles table
export interface Profile {
  id: string; // uuid
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string; // timestamp with time zone
}

export interface NewProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
}

// For polls table
export interface PollOption {
  id: number; // Assuming a simple numeric ID for options within the jsonb array
  text: string;
}

export type PollStatus = 'active' | 'closed' | 'draft'; // Based on your component logic

export interface Poll {
  id: string; // uuid
  title: string;
  description: string | null;
  options: PollOption[]; // jsonb array
  creator_id: string; // uuid
  is_public: boolean;
  allows_multiple_votes: boolean;
  expires_at: string | null; // timestamp with time zone
  qr_code_url: string | null;
  created_at: string;
  updated_at: string;
  // Add derived properties for display if needed
  status: PollStatus;
  total_votes?: number; // Will be calculated
  // For PollGrid, you might also want author name/avatar
  author_name?: string;
  author_avatar?: string;
}

export interface NewPoll {
  title: string;
  description?: string;
  options: { text: string }[]; // When creating, id will be generated on client or backend
  creator_id: string;
  is_public?: boolean;
  allows_multiple_votes?: boolean;
  expires_at?: string;
}

// For votes table
export interface Vote {
  id: string; // uuid
  poll_id: string; // uuid
  user_id: string; // uuid
  option_ids: number[]; // integer array
  created_at: string;
}

export interface NewVote {
  poll_id: string;
  user_id: string;
  option_ids: number[];
}

// For poll_analytics table
export interface PollAnalytic {
  id: string; // uuid
  poll_id: string; // uuid
  event_type: string;
  user_id: string | null; // uuid
  metadata: Record<string, any> | null; // jsonb
  created_at: string;
}

export interface NewPollAnalytic {
  poll_id: string;
  event_type: string;
  user_id?: string;
  metadata?: Record<string, any>;
}
