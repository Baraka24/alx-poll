// lib/data/polls.ts
import { createClient } from '@/lib/supabase';
import { Poll, NewPoll, PollStatus } from '@/lib/types';

const supabase = createClient();

// Helper to determine poll status based on dates
const getPollStatus = (poll: Poll): PollStatus => {
  const now = new Date();
  if (poll.expires_at && new Date(poll.expires_at) < now) {
    return 'closed';
  }
  // This logic assumes 'draft' status needs an explicit flag or different handling
  // For simplicity, if not closed, we'll consider it active for now.
  // You might want to add a 'is_draft' boolean column to your polls table.
  return 'active';
};


export async function getPolls(filters?: {
  status?: PollStatus;
  category?: string; // Assuming you'll add a category to your poll table later
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'popular' | 'votes';
  limit?: number;
  offset?: number;
}): Promise<Poll[]> {
  let query = supabase
    .from('polls')
    .select(`
      *,
      profiles(username, avatar_url)
    `)
    .eq('is_public', true) // Only fetch public polls based on RLS
    .order('created_at', { ascending: false }); // Default sort by newest

  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }

  // Note: Filtering by status (active/closed) based on expires_at would be done client-side
  // or by adding a computed column/function in Supabase if needed.
  // For 'draft', you'd need a dedicated column in the polls table.

  if (filters?.sortBy === 'oldest') {
    query = query.order('created_at', { ascending: true });
  }
  // 'popular' and 'votes' sorting would require join with votes table and aggregation,
  // which is more complex and might be added later.

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 9)) - 1);
  }


  const { data, error } = await query;

  if (error) {
    console.error('Error fetching polls:', error.message);
    throw new Error(error.message);
  }

  // Post-process to add status and author info
  return data.map(poll => ({
    ...poll,
    status: getPollStatus(poll as Poll),
    author_name: (poll.profiles as { username: string }).username,
    author_avatar: (poll.profiles as { avatar_url: string }).avatar_url,
  }));
}

export async function getPollById(pollId: string): Promise<Poll | null> {
  const { data, error } = await supabase
    .from('polls')
    .select(`
      *,
      profiles(username, avatar_url),
      votes(id) // To count total votes
    `)
    .eq('id', pollId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error('Error fetching poll by ID:', error.message);
    throw new Error(error.message);
  }

  if (!data) return null;

  // Post-process to add status and total_votes
  return {
    ...data,
    status: getPollStatus(data as Poll),
    total_votes: (data.votes as any[]).length,
    author_name: (data.profiles as { username: string }).username,
    author_avatar: (data.profiles as { avatar_url: string }).avatar_url,
  };
}

export async function createPoll(newPollData: NewPoll): Promise<Poll | null> {
  // Assign numeric IDs to options before inserting
  const optionsWithIds = newPollData.options.map((opt, index) => ({ id: index + 1, text: opt.text }));

  const { data, error } = await supabase
    .from('polls')
    .insert({
      ...newPollData,
      options: optionsWithIds,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating poll:', error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function updatePoll(pollId: string, updates: Partial<Omit<Poll, 'id' | 'created_at' | 'creator_id'>>): Promise<Poll | null> {
  const { data, error } = await supabase
    .from('polls')
    .update(updates)
    .eq('id', pollId)
    .select()
    .single();

  if (error) {
    console.error('Error updating poll:', error.message);
    throw new Error(error.message);
  }

  return data;
}
