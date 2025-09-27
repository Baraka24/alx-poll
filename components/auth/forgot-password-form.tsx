'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthActions } from '@/lib/hooks/use-auth-actions'
import { AlertCircle, CheckCircle, Mail, Key, Link as LinkIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [resetMethod, setResetMethod] = useState<'link' | 'otp'>('link')
  const [submittedMethod, setSubmittedMethod] = useState<'link' | 'otp'>('link')
  const { resetPassword, sendPasswordResetOTP, isLoading, error, clearError } = useAuthActions()

  const handleSubmit = async (e: React.FormEvent, method: 'link' | 'otp' = resetMethod) => {
    e.preventDefault()
    clearError()

    if (!email) {
      return
    }

    let result
    if (method === 'otp') {
      result = await sendPasswordResetOTP(email)
    } else {
      result = await resetPassword(email)
    }

    if (result.success) {
      setSubmittedMethod(method)
      setIsSubmitted(true)
    }
  }

  if (isSubmitted) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="space-y-2">
              <p className="font-medium">
                {submittedMethod === 'otp' ? 'Verification code sent!' : 'Password reset email sent!'}
              </p>
              <p className="text-sm">
                {submittedMethod === 'otp' ? (
                  <>
                    We've sent a verification code to <strong>{email}</strong>.
                    Please check your email and use the code to reset your password.
                  </>
                ) : (
                  <>
                    We've sent a password reset link to <strong>{email}</strong>.
                    Please check your email (including spam folder) and click the link to reset your password.
                  </>
                )}
              </p>
              <p className="text-sm text-green-700">
                {submittedMethod === 'otp' ?
                  'The verification code will expire in 10 minutes.' :
                  'The reset link will expire in 1 hour for security reasons.'
                }
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="pt-4 space-y-2">
          <Button
            onClick={() => setIsSubmitted(false)}
            variant="outline"
            className="w-full"
          >
            Send to a different email
          </Button>

          <p className="text-xs text-gray-600">
            Didn't receive the email? Check your spam folder or try again in a few minutes.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="link" className="w-full" onValueChange={(value) => setResetMethod(value as 'link' | 'otp')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="link" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Reset Link
          </TabsTrigger>
          <TabsTrigger value="otp" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Verification Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="link" className="space-y-4">
          <form onSubmit={(e) => handleSubmit(e, 'link')} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-link">Email Address</Label>
              <Input
                id="email-link"
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoFocus
              />
              <p className="text-xs text-gray-600">
                We'll send a secure reset link to this email address
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending Reset Link...
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Send Reset Link
                </>
              )}
            </Button>

            <div className="text-center text-xs text-gray-600 space-y-1">
              <p>• Reset links expire in 1 hour</p>
              <p>• Click the link in your email to reset your password</p>
              <p>• Check your spam folder if you don't see the email</p>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="otp" className="space-y-4">
          <form onSubmit={(e) => handleSubmit(e, 'otp')} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-otp">Email Address</Label>
              <Input
                id="email-otp"
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-gray-600">
                We'll send a verification code to this email address
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending Code...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Send Verification Code
                </>
              )}
            </Button>

            <div className="text-center text-xs text-gray-600 space-y-1">
              <p>• Verification codes expire in 10 minutes</p>
              <p>• Enter the code to verify and reset your password</p>
              <p>• Check your spam folder if you don't see the email</p>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
