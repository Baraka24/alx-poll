import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/magic-link/generate/route'

// Mock the dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

jest.mock('@/lib/utils/qr-code', () => ({
  generateQRCodeForMagicLink: jest.fn().mockResolvedValue('data:image/png;base64,mockQRCode')
}))

jest.mock('@/lib/security/middleware', () => ({
  applySecurityMiddleware: jest.fn().mockResolvedValue({ allowed: true })
}))

jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mock-secure-token-12345678901234567890')
  })
}))

describe('/api/auth/magic-link/generate', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock Supabase client
    mockSupabase = {
      auth: {
        admin: {
          listUsers: jest.fn().mockResolvedValue({
            data: {
              users: [{ email: 'test@example.com', id: 'user-123' }]
            },
            error: null
          })
        }
      },
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      lt: jest.fn().mockResolvedValue({ error: null })
    }

    const { createClient } = require('@/lib/supabase/server')
    createClient.mockResolvedValue(mockSupabase)
  })

  it('should generate magic link and QR code for existing user', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/magic-link/generate', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    expect(result.token).toBe('mock-secure-token-12345678901234567890')
    expect(result.qrCode).toBe('data:image/png;base64,mockQRCode')
    expect(result.magicLinkUrl).toContain('/auth/magic-link?token=')
  })

  it('should return 404 for non-existent user', async () => {
    // Mock empty users list
    mockSupabase.auth.admin.listUsers.mockResolvedValueOnce({
      data: { users: [] },
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/auth/magic-link/generate', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@example.com' }),
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(404)
    expect(result.error).toBe('User not found')
  })

  it('should return 400 for invalid email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/magic-link/generate', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email' }),
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.error).toBe('Invalid input')
  })

  it('should return 429 when rate limited', async () => {
    const { applySecurityMiddleware } = require('@/lib/security/middleware')
    applySecurityMiddleware.mockResolvedValueOnce({ allowed: false })

    const request = new NextRequest('http://localhost:3000/api/auth/magic-link/generate', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(429)
    expect(result.error).toBe('Too many requests')
  })
})
