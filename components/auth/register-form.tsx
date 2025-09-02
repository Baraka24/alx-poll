'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthActions } from '@/lib/hooks/use-auth-actions'
import Link from 'next/link'
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

export function RegisterForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [showSuccessDetails, setShowSuccessDetails] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [registeredPassword, setRegisteredPassword] = useState('')
  const { signUp, signIn, isLoading, error, clearError } = useAuthActions()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setSuccess(null)
    setShowSuccessDetails(false)

    if (!fullName || !email || !password || !confirmPassword) {
      return
    }

    if (password !== confirmPassword) {
      return
    }

    if (password.length < 6) {
      return
    }

    const result = await signUp(email, password, fullName)

    if (result.success && result.requiresConfirmation) {
      setSuccess('Account created successfully!')
      setShowSuccessDetails(true)
      // Store credentials for immediate login after email confirmation
      setRegisteredEmail(email)
      setRegisteredPassword(password)
    } else if (result.success && !result.requiresConfirmation) {
      // Account created and immediately logged in
      setSuccess('Account created and signed in successfully!')
    }
  }

  const handleDirectLogin = async () => {
    if (!registeredEmail || !registeredPassword) return

    clearError()
    const loginResult = await signIn(registeredEmail, registeredPassword)

    if (loginResult.success) {
      // User will be automatically redirected by the signIn function
    }
  }

  const passwordsMatch = password === confirmPassword || confirmPassword === ''
  const passwordValid = password.length >= 6 || password === ''

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="space-y-2">
              <p className="font-medium">{success}</p>
              {showSuccessDetails && (
                <div className="text-sm space-y-1">
                  <p>📧 Please check your email inbox for a verification link.</p>
                  <p className="text-gray-600">
                    We sent a confirmation email to <strong>{email}</strong>
                  </p>
                  <p className="text-gray-600">
                    Click the link in the email to verify your account, then return here to sign in.
                  </p>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Show login redirect after successful registration */}
      {showSuccessDetails && (
        <div className="text-center space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Go to Sign In Page
            </Link>
            <Button
              type="button"
              onClick={handleDirectLogin}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign In Now'}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            "Sign In Now" will work once you've verified your email
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
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
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className={!passwordValid ? 'border-red-500' : ''}
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
        {!passwordValid && password && (
          <p className="text-sm text-red-500">Password must be at least 6 characters</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            className={!passwordsMatch ? 'border-red-500' : ''}
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
        {!passwordsMatch && confirmPassword && (
          <p className="text-sm text-red-500">Passwords do not match</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={
          isLoading ||
          !fullName ||
          !email ||
          !password ||
          !confirmPassword ||
          !passwordsMatch ||
          !passwordValid ||
          showSuccessDetails
        }
      >
        {isLoading ? 'Creating account...' : 'Create Account'}
      </Button>

      {/* Show alternative login option if account creation is pending email verification */}
      {!showSuccessDetails && (
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </div>
      )}
    </form>
  )
}
