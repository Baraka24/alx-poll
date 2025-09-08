'use client'

import { useState } from 'react'
import { useAuthActions } from '@/lib/hooks/use-auth-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { QrCode, Link, Copy, CheckCircle, AlertCircle } from 'lucide-react'
import Image from 'next/image'

export function MagicLinkLogin() {
  const [email, setEmail] = useState('')
  const [showMagicLink, setShowMagicLink] = useState(false)
  const [magicLinkData, setMagicLinkData] = useState<{
    token: string
    qrCode: string
    magicLinkUrl: string
    expiresAt: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const { generateMagicLink, isLoading, error } = useAuthActions()

  const handleGenerateMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      return
    }

    const result = await generateMagicLink(email)

    if (result.success && result.qrCode && result.loginUrl) {
      setMagicLinkData({
        token: '', // Not needed in this approach
        qrCode: result.qrCode,
        magicLinkUrl: result.loginUrl,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      })
      setShowMagicLink(true)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const formatExpiryTime = (expiresAt: string) => {
    const expiry = new Date(expiresAt)
    const now = new Date()
    const diffMinutes = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60))
    return `${diffMinutes} minutes`
  }

  if (showMagicLink && magicLinkData) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Magic Link Sent!
          </CardTitle>
          <CardDescription>
            Check your email for the login link, or scan the QR code below to go to the login page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code */}
          <div className="text-center space-y-3">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
              <Image
                src={magicLinkData.qrCode}
                alt="QR Code for Magic Link"
                width={200}
                height={200}
                className="rounded"
              />
            </div>
            <p className="text-sm text-gray-600">
              Scan this QR code with your phone to go to the login page with your email pre-filled
            </p>
          </div>

          {/* Magic Link URL */}
          <div className="space-y-2">
            <Label htmlFor="magic-link-url" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Login Page Link
            </Label>
            <div className="flex gap-2">
              <Input
                id="magic-link-url"
                value={magicLinkData.magicLinkUrl}
                readOnly
                className="flex-1 font-mono text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(magicLinkData.magicLinkUrl)}
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Expiry Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <div>
              <p className="font-medium">✉️ Check your email for the magic link!</p>
              <p className="text-sm text-gray-600 mt-1">
                The email contains a secure link that will log you in automatically. The link expires in 1 hour for security.
              </p>
            </div>
          </Alert>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowMagicLink(false)
                setMagicLinkData(null)
                setEmail('')
              }}
              className="flex-1"
            >
              Generate New Link
            </Button>
            <Button
              onClick={() => window.open(magicLinkData.magicLinkUrl, '_blank')}
              className="flex-1"
            >
              Open Link
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Magic Link Login
        </CardTitle>
        <CardDescription>
          Generate a secure login link or QR code to sign in without a password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerateMagicLink} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <div>{error}</div>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !email}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Generating Magic Link...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                Generate Magic Link & QR Code
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
