'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Poll, Vote } from '@/lib/types/database'
import { CreatePollData, VoteData } from '@/lib/validations/poll'

const supabase = createClient()

// Fetch polls
export const usePolls = (filters?: {
  status?: 'all' | 'active' | 'closed' | 'draft'
  search?: string
  category?: string
  userId?: string
}) => {
  return useQuery({
    queryKey: ['polls', filters],
    queryFn: async (): Promise<Poll[]> => {
      let query = supabase
        .from('polls')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters?.status === 'active') {
        query = query.gt('expires_at', new Date().toISOString())
      } else if (filters?.status === 'closed') {
        query = query.lt('expires_at', new Date().toISOString())
      }

      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`)
      }

      if (filters?.userId) {
        query = query.eq('creator_id', filters.userId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
  })
}

// Fetch single poll
export const usePoll = (pollId: string) => {
  return useQuery({
    queryKey: ['poll', pollId],
    queryFn: async (): Promise<Poll | null> => {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .eq('id', pollId)
        .single()

      if (error) throw error
      return data
    },
  })
}

// Fetch poll votes
export const usePollVotes = (pollId: string) => {
  return useQuery({
    queryKey: ['poll-votes', pollId],
    queryFn: async (): Promise<Vote[]> => {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('poll_id', pollId)

      if (error) throw error
      return data || []
    },
  })
}

// Create poll mutation
export const useCreatePoll = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (pollData: CreatePollData): Promise<Poll> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('polls')
        .insert({
          title: pollData.title,
          description: pollData.description,
          options: pollData.options,
          creator_id: user.id,
          is_public: pollData.isPublic,
          allows_multiple_votes: pollData.allowsMultipleVotes,
          expires_at: pollData.expiresAt,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] })
    },
  })
}

// Vote mutation
export const useVote = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (voteData: VoteData): Promise<Vote> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('votes')
        .insert({
          poll_id: voteData.pollId,
          user_id: user.id,
          option_ids: voteData.optionIds,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['poll-votes', variables.pollId] })
    },
  })
}
