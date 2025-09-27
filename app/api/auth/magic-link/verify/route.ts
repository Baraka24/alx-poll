import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { applySecurityMiddleware } from '@/lib/security/middleware'

const verifyMagicLinkSchema = z.object({
  token: z.string().min(32).max(128),
})

export async function POST(request: NextRequest) {
  try {
    // Apply security middleware
    const securityResult = await applySecurityMiddleware(request, {
      rateLimitKey: 'magic-link-verification',
      maxRequests: 10,
      windowMs: 15 * 60 * 1000, // 15 minutes
    })

    if (!securityResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { token } = verifyMagicLinkSchema.parse(body)

    const supabase = await createClient()

    // Find the magic link
    const { data: magicLink, error: findError } = await (supabase as any)
      .from('magic_links')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (findError || !magicLink) {
      return NextResponse.json(
        { error: 'Invalid or expired magic link' },
        { status: 400 }
      )
    }

    // Mark magic link as used
    const { error: updateError } = await (supabase as any)
      .from('magic_links')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token)

    if (updateError) {
      console.error('Failed to mark magic link as used:', updateError)
    }

    // Use Supabase's signInWithOtp for magic link authentication
    const { data, error } = await supabase.auth.signInWithOtp({
      email: magicLink.email,
      options: {
        shouldCreateUser: false, // Only allow existing users
      }
    })

    if (error) {
      console.error('Failed to send OTP:', error)
      return NextResponse.json(
        { error: 'Failed to authenticate. Please try regular login.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Magic link email sent! Please check your email to complete login.',
      email: magicLink.email,
    })

  } catch (error) {
    console.error('Magic link verification error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
    }

    // Verify the magic link token
    const response = await fetch(`${request.nextUrl.origin}/api/auth/magic-link/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    const result = await response.json()

    if (!result.success) {
      return NextResponse.redirect(new URL('/login?error=invalid_or_expired_token', request.url))
    }

    // Redirect to login with success message
    return NextResponse.redirect(new URL(`/login?magic_link_sent=${encodeURIComponent(result.email)}`, request.url))

  } catch (error) {
    console.error('Magic link GET error:', error)
    return NextResponse.redirect(new URL('/login?error=authentication_failed', request.url))
  }
}
