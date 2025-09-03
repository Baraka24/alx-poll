import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/polls/route'
import { createClient } from '@/lib/supabase/server'
import { generateQRCodeForPoll } from '@/lib/utils/qr-code'

// Mock the Supabase server client
jest.mock('@/lib/supabase/server')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

// Mock QR code generation
jest.mock('@/lib/utils/qr-code')
const mockGenerateQRCode = generateQRCodeForPoll as jest.MockedFunction<typeof generateQRCodeForPoll>

// Mock NextResponse
const mockJson = jest.fn()
const mockNextResponse = {
  json: mockJson,
}
jest.mock('next/server', () => ({
  NextResponse: mockNextResponse,
  NextRequest: jest.fn(),
}))

describe('/api/polls API Route Integration Tests', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
      })),
    }

    mockCreateClient.mockResolvedValue(mockSupabaseClient)
    mockJson.mockImplementation((data, options) => ({
      json: data,
      status: options?.status || 200,
    }))
  })

  describe('GET /api/polls', () => {
    it('should fetch public polls successfully', async () => {
      const mockPolls = [
        {
          id: '1',
          title: 'Test Poll 1',
          description: 'Test Description 1',
          creator_id: 'user1',
          is_public: true,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          title: 'Test Poll 2',
          description: 'Test Description 2',
          creator_id: 'user2',
          is_public: true,
          created_at: '2024-01-02T00:00:00Z',
        },
      ]

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockPolls, error: null }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/polls')
      const response = await GET(request)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('polls')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('is_public', true)
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockJson).toHaveBeenCalledWith(mockPolls)
    })

    it('should filter polls by search term', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/polls?search=javascript')
      await GET(request)

      expect(mockQuery.ilike).toHaveBeenCalledWith('title', '%javascript%')
    })

    it('should filter polls by status (active)', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        gt: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/polls?status=active')
      await GET(request)

      expect(mockQuery.gt).toHaveBeenCalledWith('expires_at', expect.any(String))
    })

    it('should filter polls by status (closed)', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/polls?status=closed')
      await GET(request)

      expect(mockQuery.lt).toHaveBeenCalledWith('expires_at', expect.any(String))
    })

    it('should filter polls by user ID when authenticated', async () => {
      const userId = 'user123'

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const request = new NextRequest(`http://localhost:3000/api/polls?userId=${userId}`)
      await GET(request)

      expect(mockQuery.eq).toHaveBeenCalledWith('is_public', true)
      expect(mockQuery.eq).toHaveBeenCalledWith('creator_id', userId)
    })

    it('should handle database errors', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' }
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/polls')
      await GET(request)

      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    })

    it('should handle unexpected errors', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Unexpected error'))

      const request = new NextRequest('http://localhost:3000/api/polls')
      await GET(request)

      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Internal server error' },
        { status: 500 }
      )
    })
  })

  describe('POST /api/polls', () => {
    const validPollData = {
      title: 'Test Poll',
      description: 'Test Description',
      options: [
        { id: 1, text: 'Option 1' },
        { id: 2, text: 'Option 2' },
      ],
      isPublic: true,
      allowsMultipleVotes: false,
      expiresAt: '2024-12-31T23:59:59.000Z',
    }

    it('should create a poll successfully', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      const mockCreatedPoll = {
        id: 'poll123',
        ...validPollData,
        creator_id: mockUser.id,
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCreatedPoll, error: null }),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)
      mockGenerateQRCode.mockResolvedValue('data:image/png;base64,mockqrcode')

      const request = {
        json: () => Promise.resolve(validPollData),
      } as NextRequest

      await POST(request)

      expect(mockQuery.insert).toHaveBeenCalledWith({
        title: validPollData.title,
        description: validPollData.description,
        options: validPollData.options,
        creator_id: mockUser.id,
        is_public: validPollData.isPublic,
        allows_multiple_votes: validPollData.allowsMultipleVotes,
        expires_at: validPollData.expiresAt,
      })

      expect(mockGenerateQRCode).toHaveBeenCalledWith('poll123')
      expect(mockJson).toHaveBeenCalledWith(mockCreatedPoll, { status: 201 })
    })

    it('should require authentication', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const request = {
        json: () => Promise.resolve(validPollData),
      } as NextRequest

      await POST(request)

      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    })

    it('should validate poll data', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const invalidPollData = {
        title: '', // Invalid: empty title
        options: [{ id: 1, text: 'Only one option' }], // Invalid: only one option
      }

      const request = {
        json: () => Promise.resolve(invalidPollData),
      } as NextRequest

      await POST(request)

      expect(mockJson).toHaveBeenCalledWith(
        { error: expect.any(String) },
        { status: 400 }
      )
    })

    it('should handle database errors during poll creation', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database constraint violation' }
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const request = {
        json: () => Promise.resolve(validPollData),
      } as NextRequest

      await POST(request)

      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Database constraint violation' },
        { status: 500 }
      )
    })

    it('should handle QR code generation failure gracefully', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      const mockCreatedPoll = {
        id: 'poll123',
        ...validPollData,
        creator_id: mockUser.id,
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCreatedPoll, error: null }),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)
      mockGenerateQRCode.mockRejectedValue(new Error('QR generation failed'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const request = {
        json: () => Promise.resolve(validPollData),
      } as NextRequest

      await POST(request)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to generate QR code:',
        expect.any(Error)
      )
      expect(mockJson).toHaveBeenCalledWith(mockCreatedPoll, { status: 201 })

      consoleSpy.mockRestore()
    })

    it('should handle malformed JSON requests', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const request = {
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as NextRequest

      await POST(request)

      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Invalid JSON' },
        { status: 400 }
      )
    })

    it('should handle unexpected errors', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Unexpected error'))

      const request = {
        json: () => Promise.resolve(validPollData),
      } as NextRequest

      await POST(request)

      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Internal server error' },
        { status: 500 }
      )
    })
  })
})
