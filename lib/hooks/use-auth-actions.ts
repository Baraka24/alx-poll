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

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }

      return {
        success: true,
        message: 'Password reset email sent. Please check your inbox.'
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
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
    generateMagicLink,
    isLoading,
    error,
    clearError: () => setError(null),
  }
}
