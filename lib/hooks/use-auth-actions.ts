'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'

export function useAuthActions() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }

      // Profile will be created via database triggers or policies
      // Commenting out direct profile creation to avoid type issues
      /*
      if (data.user) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              full_name: data.user.user_metadata?.full_name || '',
              avatar_url: data.user.user_metadata?.avatar_url || '',
            }, {
              onConflict: 'id'
            })

          if (profileError) {
            console.warn('Profile creation failed:', profileError)
          }
        } catch (profileErr) {
          console.warn('Profile operation failed:', profileErr)
        }
      }
      */

      router.push('/polls')
      router.refresh()
      return { success: true, data }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(message)
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
        },
      })

      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        return {
          success: true,
          requiresConfirmation: true,
          message: 'Please check your email to confirm your account.'
        }
      }

      router.push('/polls')
      router.refresh()
      return { success: true, data }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(message)
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { error } = await supabase.auth.signOut()

      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }

      router.push('/login')
      router.refresh()
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(message)
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (email: string, options?: { useOTP?: boolean }) => {
    try {
      setIsLoading(true)
      setError(null)

      // Option to use OTP instead of email link
      if (options?.useOTP) {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
          captchaToken: undefined, // Add captcha if needed
        })

        if (error) {
          setError(error.message)
          return { success: false, error: error.message }
        }

        return {
          success: true,
          message: 'Password reset OTP sent to your email. Please check your inbox.',
          data
        }
      }

      // Default: Send password reset email with link
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        let errorMessage = error.message

        // Provide more user-friendly error messages
        if (error.message.includes('not found')) {
          errorMessage = 'No account found with this email address. Please check your email or sign up for a new account.'
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Too many requests. Please wait a few minutes before trying again.'
        } else if (error.message.includes('invalid email')) {
          errorMessage = 'Please enter a valid email address.'
        }

        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      return {
        success: true,
        message: 'Password reset email sent! Please check your inbox and follow the instructions to reset your password.',
        data
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred while sending the reset email'
      setError(message)
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }

  const sendPasswordResetOTP = async (email: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Send OTP for password reset
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password-otp`,
      })

      if (error) {
        let errorMessage = error.message

        if (error.message.includes('not found')) {
          errorMessage = 'No account found with this email address.'
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Too many requests. Please wait before trying again.'
        }

        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      return {
        success: true,
        message: 'A verification code has been sent to your email.',
        data
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send verification code'
      setError(message)
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }

  const generateMagicLink = async (email: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/auth/magic-link/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to generate magic link')
        return { success: false, error: result.error || 'Failed to generate magic link' }
      }

      return {
        success: true,
        token: result.token,
        qrCode: result.qrCode,
        magicLinkUrl: result.magicLinkUrl,
        expiresAt: result.expiresAt,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(message)
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    signIn,
    signUp,
    signOut,
    resetPassword,
    sendPasswordResetOTP,
    generateMagicLink,
    isLoading,
    error,
    clearError: () => setError(null),
  }
}
