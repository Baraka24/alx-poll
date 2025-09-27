import { LoginForm } from '@/components/auth/login-form'
import { MagicLinkLogin } from '@/components/auth/magic-link-login'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ALX Poll</h1>
          <p className="text-gray-600 mt-2">Create and share interactive polls</p>
        </div>

        <div className="space-y-6">
          <Tabs defaultValue="traditional" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="traditional">Email & Password</TabsTrigger>
              <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
            </TabsList>

            <TabsContent value="traditional">
              <Card className="shadow-lg border-0">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
                  <CardDescription className="text-center">
                    Sign in to your account to continue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<div>Loading...</div>}>
                    <LoginForm />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="magic-link">
              <div className="flex justify-center">
                <MagicLinkLogin />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
