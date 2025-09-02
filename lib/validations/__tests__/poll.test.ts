import { 
  pollOptionSchema, 
  createPollSchema, 
  voteSchema,
  type CreatePollData,
  type VoteData 
} from '@/lib/validations/poll'

describe('Poll Validation Schemas', () => {
  describe('pollOptionSchema', () => {
    it('should validate valid poll option', () => {
      const validOption = {
        id: 1,
        text: 'Valid option text'
      }

      const result = pollOptionSchema.safeParse(validOption)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validOption)
      }
    })

    it('should reject option with empty text', () => {
      const invalidOption = {
        id: 1,
        text: ''
      }

      const result = pollOptionSchema.safeParse(invalidOption)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Option text is required')
      }
    })

    it('should reject option with text too long', () => {
      const invalidOption = {
        id: 1,
        text: 'a'.repeat(201) // 201 characters
      }

      const result = pollOptionSchema.safeParse(invalidOption)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Option text too long')
      }
    })

    it('should reject option without id', () => {
      const invalidOption = {
        text: 'Valid text'
      }

      const result = pollOptionSchema.safeParse(invalidOption)
      expect(result.success).toBe(false)
    })

    it('should accept option with exactly 200 characters', () => {
      const validOption = {
        id: 1,
        text: 'a'.repeat(200) // Exactly 200 characters
      }

      const result = pollOptionSchema.safeParse(validOption)
      expect(result.success).toBe(true)
    })
  })

  describe('createPollSchema', () => {
    const validPollData: CreatePollData = {
      title: 'Test Poll',
      description: 'Test description',
      options: [
        { id: 1, text: 'Option 1' },
        { id: 2, text: 'Option 2' }
      ],
      isPublic: true,
      allowsMultipleVotes: false
    }

    it('should validate valid poll data', () => {
      const result = createPollSchema.safeParse(validPollData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Test Poll')
        expect(result.data.options).toHaveLength(2)
      }
    })

    it('should apply default values for boolean fields', () => {
      const pollWithoutDefaults = {
        title: 'Test Poll',
        options: [
          { id: 1, text: 'Option 1' },
          { id: 2, text: 'Option 2' }
        ]
      }

      const result = createPollSchema.safeParse(pollWithoutDefaults)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isPublic).toBe(true)
        expect(result.data.allowsMultipleVotes).toBe(false)
      }
    })

    it('should reject poll with empty title', () => {
      const invalidPoll = {
        ...validPollData,
        title: ''
      }

      const result = createPollSchema.safeParse(invalidPoll)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title is required')
      }
    })

    it('should reject poll with title too long', () => {
      const invalidPoll = {
        ...validPollData,
        title: 'a'.repeat(201)
      }

      const result = createPollSchema.safeParse(invalidPoll)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title too long')
      }
    })

    it('should reject poll with description too long', () => {
      const invalidPoll = {
        ...validPollData,
        description: 'a'.repeat(1001)
      }

      const result = createPollSchema.safeParse(invalidPoll)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Description too long')
      }
    })

    it('should accept poll without description', () => {
      const { description, ...pollWithoutDescription } = validPollData

      const result = createPollSchema.safeParse(pollWithoutDescription)
      expect(result.success).toBe(true)
    })

    it('should reject poll with only one option', () => {
      const invalidPoll = {
        ...validPollData,
        options: [{ id: 1, text: 'Only option' }]
      }

      const result = createPollSchema.safeParse(invalidPoll)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least 2 options required')
      }
    })

    it('should reject poll with too many options', () => {
      const invalidPoll = {
        ...validPollData,
        options: Array.from({ length: 11 }, (_, i) => ({ id: i + 1, text: `Option ${i + 1}` }))
      }

      const result = createPollSchema.safeParse(invalidPoll)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Maximum 10 options allowed')
      }
    })

    it('should accept poll with exactly 10 options', () => {
      const validPollWith10Options = {
        ...validPollData,
        options: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, text: `Option ${i + 1}` }))
      }

      const result = createPollSchema.safeParse(validPollWith10Options)
      expect(result.success).toBe(true)
    })

    it('should validate datetime format for expiresAt', () => {
      const pollWithExpiry = {
        ...validPollData,
        expiresAt: '2024-12-31T23:59:59.000Z'
      }

      const result = createPollSchema.safeParse(pollWithExpiry)
      expect(result.success).toBe(true)
    })

    it('should reject invalid datetime format for expiresAt', () => {
      const pollWithInvalidExpiry = {
        ...validPollData,
        expiresAt: '2024-12-31'
      }

      const result = createPollSchema.safeParse(pollWithInvalidExpiry)
      expect(result.success).toBe(false)
    })
  })

  describe('voteSchema', () => {
    const validVoteData: VoteData = {
      pollId: '123e4567-e89b-12d3-a456-426614174000',
      optionIds: [1, 2]
    }

    it('should validate valid vote data', () => {
      const result = voteSchema.safeParse(validVoteData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.pollId).toBe('123e4567-e89b-12d3-a456-426614174000')
        expect(result.data.optionIds).toEqual([1, 2])
      }
    })

    it('should validate single option vote', () => {
      const singleVote = {
        ...validVoteData,
        optionIds: [1]
      }

      const result = voteSchema.safeParse(singleVote)
      expect(result.success).toBe(true)
    })

    it('should reject vote with invalid UUID', () => {
      const invalidVote = {
        ...validVoteData,
        pollId: 'invalid-uuid'
      }

      const result = voteSchema.safeParse(invalidVote)
      expect(result.success).toBe(false)
    })

    it('should reject vote with empty option IDs', () => {
      const invalidVote = {
        ...validVoteData,
        optionIds: []
      }

      const result = voteSchema.safeParse(invalidVote)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least one option must be selected')
      }
    })

    it('should reject vote without pollId', () => {
      const invalidVote = {
        optionIds: [1, 2]
      }

      const result = voteSchema.safeParse(invalidVote)
      expect(result.success).toBe(false)
    })

    it('should reject vote without optionIds', () => {
      const invalidVote = {
        pollId: '123e4567-e89b-12d3-a456-426614174000'
      }

      const result = voteSchema.safeParse(invalidVote)
      expect(result.success).toBe(false)
    })
  })
})
