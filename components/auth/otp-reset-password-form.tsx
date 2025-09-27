'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthActions } from '@/lib/hooks/use-auth-actions'
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock, Mail, KeyRound } from 'lucide-react'
import Link from 'next/link'

export function OTPResetPasswordForm() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [step, setStep] = useState<'otp' | 'password'>('otp')

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { sendPasswordResetOTP } = useAuthActions()

  useEffect(() => {
    // Get email from URL params if available
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
    }
  }, [searchParams])

  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?])/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return { isValid: errors.length === 0, errors }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !otp) {
      setError('Please enter both email and verification code')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery'
      })

      if (error) {
        if (error.message.includes('expired')) {
          setError('Verification code has expired. Please request a new one.')
        } else if (error.message.includes('invalid')) {
          setError('Invalid verification code. Please check and try again.')
        } else {
          setError(error.message)
        }
      } else {
        setStep('password')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors.join('. '))
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message)
      } else {
        setIsSuccess(true)
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/login?message=Password%20reset%20successfully!%20Please%20sign%20in%20with%20your%20new%20password.')
        }, 2000)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    const result = await sendPasswordResetOTP(email)
    if (result.success) {
      setError(null)
      // Show a temporary success message
      const originalError = error
      setError('New verification code sent!')
      setTimeout(() => setError(originalError), 3000)
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="space-y-2">
              <p className="font-medium">Password reset successful!</p>
              <p className="text-sm">
                Your password has been updated successfully. You can now sign in with your new password.
              </p>
              <p className="text-sm">
                Redirecting you to the login page...
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (step === 'otp') {
    return (
      <div className="space-y-4">
        {error && (
          <Alert variant={error.includes('sent') ? 'default' : 'destructive'} className={error.includes('sent') ? 'border-green-200 bg-green-50' : ''}>
            {error.includes('sent') ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription className={error.includes('sent') ? 'text-green-800' : ''}>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={isLoading}
              required
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
            <p className="text-xs text-gray-600">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !email || !otp || otp.length !== 6}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Verifying Code...
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4 mr-2" />
                Verify Code
              </>
            )}
          </Button>

          <div className="text-center space-y-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleResendCode}
              disabled={isLoading || !email}
              className="text-sm"
            >
              <Mail className="w-4 h-4 mr-2" />
              Resend Code
            </Button>

            <div className="text-xs text-gray-600 space-y-1">
              <p>• Code expires in 10 minutes</p>
              <p>• Check your spam folder if you don't see the email</p>
            </div>
          </div>
        </form>
      </div>
    )
  }

  return (
    <form onSubmit={handleResetPassword} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="text-center mb-4">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <p className="text-sm text-green-600 mt-2 font-medium">
          Code verified successfully!
        </p>
        <p className="text-xs text-gray-600">
          Now set your new password
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <p>Your password must contain:</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li>At least 8 characters</li>
            <li>One uppercase letter</li>
            <li>One lowercase letter</li>
            <li>One number</li>
            <li>One special character</li>
          </ul>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isLoading}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !password || !confirmPassword}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Updating Password...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            Reset Password
          </>
        )}
      </Button>

      <div className="text-center text-xs text-gray-600">
        <p>After resetting, you'll be redirected to sign in with your new password</p>
      </div>
    </form>
  )
}
