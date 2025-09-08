import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { generateQRCode } from '@/lib/utils/qr-code'
import { applySecurityMiddleware } from '@/lib/security/middleware'

const generateMagicLinkSchema = z.object({
  email: z.string().email().max(254).toLowerCase(),
})

export async function POST(request: NextRequest) {
  try {
    // Apply security middleware
    const securityResult = await applySecurityMiddleware(request, {
      rateLimitKey: 'magic-link-generation',
      maxRequests: 3,
      windowMs: 15 * 60 * 1000, // 15 minutes
    })

    if (!securityResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const validatedData = generateMagicLinkSchema.parse(body)
    
    const supabase = await createClient()

    // Send magic link using Supabase's built-in OTP
    const { data, error } = await supabase.auth.signInWithOtp({
      email: validatedData.email,
      options: {
        shouldCreateUser: false, // Only allow existing users
      }
    })

    if (error) {
      console.error('Failed to send magic link:', error)
      
      if (error.message.includes('User not found')) {
        return NextResponse.json(
          { error: 'User not found. Please register first or use email/password login.' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to send magic link' },
        { status: 500 }
      )
    }

    // Create a simple login URL for QR code that pre-fills email
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login?email=${encodeURIComponent(validatedData.email)}`
    const qrCodeDataUrl = await generateQRCode(loginUrl)

    return NextResponse.json({
      success: true,
      message: 'Magic link sent to your email!',
      qrCode: qrCodeDataUrl,
      email: validatedData.email,
      loginUrl,
    })

  } catch (error) {
    console.error('Magic link generation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
