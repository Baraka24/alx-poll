import { CreatePollForm } from '@/components/polls/create-poll-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CreatePollPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/polls">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Polls
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create a New Poll</h1>
        <p className="text-muted-foreground">
          Create an engaging poll to gather opinions from the community
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Poll Details</CardTitle>
          <CardDescription>
            Fill in the information below to create your poll
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreatePollForm />
        </CardContent>
      </Card>
    </div>
  )
}
