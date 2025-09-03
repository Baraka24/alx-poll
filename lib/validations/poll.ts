import { z } from 'zod'

// Constants for validation limits
export const POLL_LIMITS = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 1000,
  OPTION_TEXT_MIN_LENGTH: 1,
  OPTION_TEXT_MAX_LENGTH: 200,
  MIN_OPTIONS: 2,
  MAX_OPTIONS: 10,
  MAX_VOTES_PER_USER: 50, // Prevent spam voting
} as const

// Custom validation helpers
const trimmedString = (schema: z.ZodString) =>
  z.preprocess((val) => typeof val === 'string' ? val.trim() : val, schema)

const futureDate = () =>
  z.string().datetime().refine((date) => new Date(date) > new Date(), {
    message: 'Expiry date must be in the future',
  })

// Core validation schemas
export const pollOptionSchema = z.object({
  id: z.number().int().positive('Option ID must be a positive integer'),
  text: trimmedString(
    z.string()
      .min(POLL_LIMITS.OPTION_TEXT_MIN_LENGTH, 'Option text cannot be empty')
      .max(POLL_LIMITS.OPTION_TEXT_MAX_LENGTH, `Option text cannot exceed ${POLL_LIMITS.OPTION_TEXT_MAX_LENGTH} characters`)
  ),
})

export const createPollSchema = z.object({
  title: trimmedString(
    z.string()
      .min(POLL_LIMITS.TITLE_MIN_LENGTH, 'Poll title is required')
      .max(POLL_LIMITS.TITLE_MAX_LENGTH, `Poll title cannot exceed ${POLL_LIMITS.TITLE_MAX_LENGTH} characters`)
  ),
  description: trimmedString(
    z.string()
      .max(POLL_LIMITS.DESCRIPTION_MAX_LENGTH, `Description cannot exceed ${POLL_LIMITS.DESCRIPTION_MAX_LENGTH} characters`)
  ).optional(),
  options: z
    .array(pollOptionSchema)
    .min(POLL_LIMITS.MIN_OPTIONS, `Poll must have at least ${POLL_LIMITS.MIN_OPTIONS} options`)
    .max(POLL_LIMITS.MAX_OPTIONS, `Poll cannot have more than ${POLL_LIMITS.MAX_OPTIONS} options`)
    .refine(
      (options) => {
        const texts = options.map(opt => opt.text.toLowerCase())
        return new Set(texts).size === texts.length
      },
      { message: 'Poll options must be unique (case-insensitive)' }
    )
    .refine(
      (options) => {
        const ids = options.map(opt => opt.id)
        return new Set(ids).size === ids.length
      },
      { message: 'Option IDs must be unique' }
    ),
  isPublic: z.boolean().default(true),
  allowsMultipleVotes: z.boolean().default(false),
  expiresAt: futureDate().optional(),
})

export const updatePollSchema = createPollSchema.partial().extend({
  id: z.string().uuid('Invalid poll ID format'),
})

export const voteSchema = z.object({
  pollId: z.string().uuid('Invalid poll ID format'),
  optionIds: z
    .array(z.number().int().positive('Invalid option ID'))
    .min(1, 'At least one option must be selected')
    .max(POLL_LIMITS.MAX_VOTES_PER_USER, `Cannot select more than ${POLL_LIMITS.MAX_VOTES_PER_USER} options`)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      { message: 'Cannot vote for the same option multiple times' }
    ),
})

export const pollFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'expired', 'all']).default('all'),
  createdBy: z.string().uuid().optional(),
  isPublic: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['created_at', 'title', 'votes_count']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Response schemas for API consistency
export const pollResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  options: z.array(z.object({
    id: z.number(),
    text: z.string(),
    votes_count: z.number().default(0),
  })),
  creator_id: z.string().uuid(),
  is_public: z.boolean(),
  allows_multiple_votes: z.boolean(),
  expires_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  total_votes: z.number().default(0),
  qr_code_url: z.string().url().nullable(),
})

export const voteResponseSchema = z.object({
  id: z.string().uuid(),
  poll_id: z.string().uuid(),
  user_id: z.string().uuid(),
  option_ids: z.array(z.number()),
  created_at: z.string().datetime(),
})

// Type exports
export type CreatePollData = z.infer<typeof createPollSchema>
export type UpdatePollData = z.infer<typeof updatePollSchema>
export type VoteData = z.infer<typeof voteSchema>
export type PollFilterData = z.infer<typeof pollFilterSchema>
export type PollResponse = z.infer<typeof pollResponseSchema>
export type VoteResponse = z.infer<typeof voteResponseSchema>
export type PollOption = z.infer<typeof pollOptionSchema>

// Validation helper functions
export const validatePoll = (data: unknown) => createPollSchema.safeParse(data)
export const validateVote = (data: unknown) => voteSchema.safeParse(data)
export const validatePollFilter = (data: unknown) => pollFilterSchema.safeParse(data)

// Utility functions for common validations
export const isPollExpired = (expiresAt: string | null): boolean => {
  if (!expiresAt) return false
  return new Date(expiresAt) <= new Date()
}

export const canUserVote = (
  poll: { allows_multiple_votes: boolean; expires_at: string | null },
  hasUserVoted: boolean
): { canVote: boolean; reason?: string } => {
  if (isPollExpired(poll.expires_at)) {
    return { canVote: false, reason: 'Poll has expired' }
  }

  if (hasUserVoted && !poll.allows_multiple_votes) {
    return { canVote: false, reason: 'You have already voted on this poll' }
  }

  return { canVote: true }
}
