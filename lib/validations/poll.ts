import { z } from 'zod'

export const pollOptionSchema = z.object({
  id: z.number(),
  text: z.string().min(1, 'Option text is required').max(200, 'Option text too long'),
})

export const createPollSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  options: z
    .array(pollOptionSchema)
    .min(2, 'At least 2 options required')
    .max(10, 'Maximum 10 options allowed'),
  isPublic: z.boolean().default(true),
  allowsMultipleVotes: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
})

export const voteSchema = z.object({
  pollId: z.string().uuid(),
  optionIds: z.array(z.number()).min(1, 'At least one option must be selected'),
})

export type CreatePollData = z.infer<typeof createPollSchema>
export type VoteData = z.infer<typeof voteSchema>
