'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function MagicLinkPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage('Invalid magic link - no token provided')
      return
    }

    verifyMagicLink(token)
  }, [searchParams])

  const verifyMagicLink = async (token: string) => {
    try {
      const response = await fetch('/api/auth/magic-link/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const result = await response.json()

      if (result.success && result.authUrl) {
        setStatus('success')
        setMessage('Magic link verified! Redirecting you to the app...')

        // Redirect to Supabase auth URL
        window.location.href = result.authUrl
      } else {
        setStatus('error')
        setMessage(result.error || 'Magic link verification failed')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Network error - please try again')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Magic Link Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            {status === 'loading' && (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-gray-600">Verifying your magic link...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center space-y-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <p className="text-green-600 font-medium">{message}</p>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center space-y-4">
                <XCircle className="h-8 w-8 text-red-500" />
                <p className="text-red-600 font-medium">{message}</p>
                <div className="space-y-2">
                  <Button
                    onClick={() => router.push('/login')}
                    className="w-full"
                  >
                    Go to Login
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/')}
                    className="w-full"
                  >
                    Go to Home
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
