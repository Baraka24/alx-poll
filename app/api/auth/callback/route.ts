import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/polls'
  const type = searchParams.get('type') // email confirmation type

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      // Determine redirect URL based on confirmation type
      let redirectUrl = next

      if (type === 'signup') {
        // Redirect to login with confirmation message for email verification
        redirectUrl = '/login?confirmed=true&message=' + encodeURIComponent('Email confirmed successfully! You can now sign in.')
      }

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectUrl}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectUrl}`)
      } else {
        return NextResponse.redirect(`${origin}${redirectUrl}`)
      }
    } else {
      // Handle email confirmation errors
      const errorMessage = error.message.includes('already been confirmed')
        ? 'Email already confirmed. Please sign in.'
        : 'Email confirmation failed. Please try again.'

      return NextResponse.redirect(
        `${origin}/login?confirmed=false&message=${encodeURIComponent(errorMessage)}`
      )
    }
  }

  // Return the user to login with error message
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('Invalid or expired confirmation link')}`
  )
}
