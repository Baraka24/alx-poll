import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { generateQRCode, generateMagicLinkUrl, generateQRCodeForMagicLink } from '@/lib/utils/qr-code'

// Mock QRCode module
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockQRCode')
}))

describe('Magic Link QR Code Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateMagicLinkUrl', () => {
    it('should generate a magic link URL with token', () => {
      const token = 'test-token-123'
      const baseUrl = 'http://localhost:3000'
      
      const result = generateMagicLinkUrl(token, baseUrl)
      
      expect(result).toBe('http://localhost:3000/auth/magic-link?token=test-token-123')
    })

    it('should use default URL when baseUrl not provided', () => {
      const token = 'test-token-123'
      
      const result = generateMagicLinkUrl(token)
      
      expect(result).toContain('/auth/magic-link?token=test-token-123')
    })
  })

  describe('generateQRCodeForMagicLink', () => {
    it('should generate QR code for magic link', async () => {
      const token = 'test-token-123'
      
      const result = await generateQRCodeForMagicLink(token)
      
      expect(result).toBe('data:image/png;base64,mockQRCode')
    })

    it('should handle QR code generation errors', async () => {
      const QRCode = require('qrcode')
      QRCode.toDataURL.mockRejectedValueOnce(new Error('QR code generation failed'))
      
      const token = 'test-token-123'
      
      await expect(generateQRCodeForMagicLink(token)).rejects.toThrow('Failed to generate QR code')
    })
  })

  describe('generateQRCode', () => {
    it('should generate QR code with default options', async () => {
      const url = 'https://example.com'
      
      const result = await generateQRCode(url)
      
      expect(result).toBe('data:image/png;base64,mockQRCode')
    })
  })
})
