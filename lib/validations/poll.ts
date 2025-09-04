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
  MAX_POLLS_PER_USER_PER_DAY: 10, // Rate limiting
  MIN_EXPIRY_MINUTES: 5, // Minimum poll duration
  MAX_EXPIRY_DAYS: 365, // Maximum poll duration
} as const

// Security patterns
export const SECURITY_PATTERNS = {
  HTML_TAGS: /<[^>]*>/g,
  SCRIPT_TAGS: /<script[^>]*>.*?<\/script>/gi,
  SUSPICIOUS_PROTOCOLS: /^(javascript|data|vbscript):/i,
  SQL_INJECTION: /('|"|;|--|\/\*|\*\/|\||\%|\=|\+)/i,
  XSS_PATTERNS: /(<script|<iframe|<object|<embed|<form|javascript:|data:|vbscript:)/i,
} as const

// Custom validation helpers with security enhancements
const sanitizeString = (str: string): string => {
  return str
    .replace(SECURITY_PATTERNS.HTML_TAGS, '') // Remove HTML tags
    .replace(SECURITY_PATTERNS.SCRIPT_TAGS, '') // Remove script tags
    .trim()
}

const secureString = (schema: z.ZodString) =>
  z.preprocess((val) => {
    if (typeof val !== 'string') return val

    // Sanitize the input
    const sanitized = sanitizeString(val)

    // Check for suspicious patterns
    if (SECURITY_PATTERNS.XSS_PATTERNS.test(sanitized)) {
      throw new Error('Invalid content detected')
    }

    if (SECURITY_PATTERNS.SQL_INJECTION.test(sanitized)) {
      throw new Error('Invalid characters detected')
    }

    return sanitized
  }, schema)

const secureUrl = () =>
  z.string().url().refine((url) => {
    const parsedUrl = new URL(url)
    // Only allow HTTP/HTTPS protocols
    return ['http:', 'https:'].includes(parsedUrl.protocol)
  }, { message: 'Only HTTP and HTTPS URLs are allowed' })

const futureDate = () =>
  z.string().datetime().refine((date) => {
    const expiry = new Date(date)
    const now = new Date()
    const minExpiry = new Date(now.getTime() + POLL_LIMITS.MIN_EXPIRY_MINUTES * 60 * 1000)
    const maxExpiry = new Date(now.getTime() + POLL_LIMITS.MAX_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

    return expiry >= minExpiry && expiry <= maxExpiry
  }, {
    message: `Expiry date must be between ${POLL_LIMITS.MIN_EXPIRY_MINUTES} minutes and ${POLL_LIMITS.MAX_EXPIRY_DAYS} days from now`,
  })// Core validation schemas
export const pollOptionSchema = z.object({
  id: z.number().int().positive('Option ID must be a positive integer').max(10000, 'Option ID too large'),
  text: secureString(
    z.string()
      .min(POLL_LIMITS.OPTION_TEXT_MIN_LENGTH, 'Option text cannot be empty')
      .max(POLL_LIMITS.OPTION_TEXT_MAX_LENGTH, `Option text cannot exceed ${POLL_LIMITS.OPTION_TEXT_MAX_LENGTH} characters`)
  ),
})

export const createPollSchema = z.object({
  title: secureString(
    z.string()
      .min(POLL_LIMITS.TITLE_MIN_LENGTH, 'Poll title is required')
      .max(POLL_LIMITS.TITLE_MAX_LENGTH, `Poll title cannot exceed ${POLL_LIMITS.TITLE_MAX_LENGTH} characters`)
  ),
  description: secureString(
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
}).refine(
  (data) => {
    // Ensure at least one field is being updated
    const { id, ...updateFields } = data
    return Object.values(updateFields).some(value => value !== undefined)
  },
  { message: 'At least one field must be provided for update' }
)

export const voteSchema = z.object({
  pollId: z.string().uuid('Invalid poll ID format'),
  optionIds: z
    .array(z.number().int().positive('Invalid option ID').max(10000, 'Option ID too large'))
    .min(1, 'At least one option must be selected')
    .max(POLL_LIMITS.MAX_VOTES_PER_USER, `Cannot select more than ${POLL_LIMITS.MAX_VOTES_PER_USER} options`)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      { message: 'Cannot vote for the same option multiple times' }
    ),
})

export const pollFilterSchema = z.object({
  search: secureString(z.string().max(100, 'Search term too long')).optional(),
  status: z.enum(['active', 'expired', 'all']).default('all'),
  createdBy: z.string().uuid().optional(),
  isPublic: z.boolean().optional(),
  page: z.number().int().positive().max(1000, 'Page number too large').default(1),
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
    votes_count: z.number().min(0).default(0),
  })),
  creator_id: z.string().uuid(),
  is_public: z.boolean(),
  allows_multiple_votes: z.boolean(),
  expires_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  total_votes: z.number().min(0).default(0),
  qr_code_url: secureUrl().nullable(),
})

export const voteResponseSchema = z.object({
  id: z.string().uuid(),
  poll_id: z.string().uuid(),
  user_id: z.string().uuid(),
  option_ids: z.array(z.number().positive()),
  created_at: z.string().datetime(),
})

// Rate limiting schemas
export const rateLimitSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['create_poll', 'vote', 'update_poll']),
  timestamp: z.string().datetime(),
  ip: z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, 'Invalid IP address').optional(),
})

// Security audit schema
export const auditLogSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['create_poll', 'update_poll', 'delete_poll', 'vote', 'login', 'register']),
  resourceId: z.string().uuid().optional(),
  ip: z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, 'Invalid IP address'),
  userAgent: z.string().max(500),
  timestamp: z.string().datetime(),
  metadata: z.record(z.string(), z.string()).optional(),
})

// Type exports
export type CreatePollData = z.infer<typeof createPollSchema>
export type UpdatePollData = z.infer<typeof updatePollSchema>
export type VoteData = z.infer<typeof voteSchema>
export type PollFilterData = z.infer<typeof pollFilterSchema>
export type PollResponse = z.infer<typeof pollResponseSchema>
export type VoteResponse = z.infer<typeof voteResponseSchema>
export type PollOption = z.infer<typeof pollOptionSchema>
export type RateLimit = z.infer<typeof rateLimitSchema>
export type AuditLog = z.infer<typeof auditLogSchema>

// Validation helper functions
export const validatePoll = (data: unknown) => createPollSchema.safeParse(data)
export const validateVote = (data: unknown) => voteSchema.safeParse(data)
export const validatePollFilter = (data: unknown) => pollFilterSchema.safeParse(data)

// Security utility functions
export const sanitizeHtml = (input: string): string => {
  return sanitizeString(input)
}

export const validateContentSecurity = (content: string): { isValid: boolean; reason?: string } => {
  if (SECURITY_PATTERNS.XSS_PATTERNS.test(content)) {
    return { isValid: false, reason: 'Potential XSS content detected' }
  }

  if (SECURITY_PATTERNS.SQL_INJECTION.test(content)) {
    return { isValid: false, reason: 'Potential SQL injection detected' }
  }

  if (SECURITY_PATTERNS.SUSPICIOUS_PROTOCOLS.test(content)) {
    return { isValid: false, reason: 'Suspicious protocol detected' }
  }

  return { isValid: true }
}

export const checkRateLimit = (
  userId: string,
  action: string,
  requestsInWindow: number,
  windowMinutes: number = 60
): { allowed: boolean; reason?: string } => {
  const limits = {
    create_poll: POLL_LIMITS.MAX_POLLS_PER_USER_PER_DAY,
    vote: 100, // 100 votes per hour
    update_poll: 20, // 20 updates per hour
  }

  const limit = limits[action as keyof typeof limits] || 10

  if (requestsInWindow >= limit) {
    return {
      allowed: false,
      reason: `Rate limit exceeded. Maximum ${limit} ${action} actions per ${windowMinutes} minutes`
    }
  }

  return { allowed: true }
}

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

export const validatePollOwnership = (
  poll: { creator_id: string },
  userId: string
): { isOwner: boolean; reason?: string } => {
  if (poll.creator_id !== userId) {
    return { isOwner: false, reason: 'You do not have permission to modify this poll' }
  }

  return { isOwner: true }
}

export const createAuditLog = (
  userId: string,
  action: AuditLog['action'],
  ip: string,
  userAgent: string,
  resourceId?: string,
  metadata?: Record<string, string>
): AuditLog => {
  return {
    userId,
    action,
    resourceId,
    ip,
    userAgent: userAgent.substring(0, 500), // Truncate to prevent abuse
    timestamp: new Date().toISOString(),
    metadata,
  }
}
