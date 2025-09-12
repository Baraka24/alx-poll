// lib/data/votes.ts
import { createClient } from '@/lib/supabase';
import { NewVote, Vote } from '@/lib/types';

const supabase = createClient();

export async function submitVote(newVoteData: NewVote): Promise<Vote | null> {
  const { data, error } = await supabase
    .from('votes')
    .insert(newVoteData)
    .select()
    .single();

  if (error) {
    console.error('Error submitting vote:', error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function getVotesByPoll(pollId: string): Promise<Vote[]> {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('poll_id', pollId);

  if (error) {
    console.error('Error fetching votes for poll:', error.message);
    throw new Error(error.message);
  }

  return data;
}

// Function to get aggregated vote counts for a poll (requires client-side processing or a Supabase RPC function)
export async function getAggregatedVotes(pollId: string): Promise<Record<number, number>> {
  const { data: votes, error } = await supabase
    .from('votes')
    .select('option_ids')
    .eq('poll_id', pollId);

  if (error) {
    console.error('Error fetching votes for aggregation:', error.message);
    throw new Error(error.message);
  }

  const voteCounts: Record<number, number> = {};
  votes.forEach(vote => {
    vote.option_ids.forEach((optionId: number) => {
      voteCounts[optionId] = (voteCounts[optionId] || 0) + 1;
    });
  });

  return voteCounts;
}


