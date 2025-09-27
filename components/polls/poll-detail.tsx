'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, User, Clock, Loader2, AlertCircle } from 'lucide-react'
import { usePoll, usePollVotes } from '@/lib/hooks/use-polls'

interface PollDetailProps {
  pollId: string
}

export function PollDetail({ pollId }: PollDetailProps) {
  const { data: poll, isLoading, error } = usePoll(pollId)
  const { data: votes } = usePollVotes(pollId)

  const getStatusColor = (isExpired: boolean) => {
    return isExpired
      ? 'bg-red-100 text-red-800'
      : 'bg-green-100 text-green-800'
  }

  const getStatusText = (isExpired: boolean) => {
    return isExpired ? 'Closed' : 'Active'
  }

  const isPollExpired = poll?.expires_at ? new Date(poll.expires_at) <= new Date() : false
  const totalVotes = votes?.length || 0

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading poll details...</span>
        </CardContent>
      </Card>
    )
  }

  if (error || !poll) {
    return (
      <Card>
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load poll details. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">{poll.title}</CardTitle>
          <Badge className={getStatusColor(isPollExpired)}>
            {getStatusText(isPollExpired)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {poll.description && (
          <p className="text-gray-600 leading-relaxed">
            {poll.description}
          </p>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Created by Poll Creator</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Created on {new Date(poll.created_at).toLocaleDateString()}</span>
          </div>
          {poll.expires_at && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                {isPollExpired ? 'Ended' : 'Ends'} on {new Date(poll.expires_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <strong>{totalVotes}</strong> total votes
            </p>
            {poll.allows_multiple_votes && (
              <Badge variant="outline" className="text-xs">
                Multiple votes allowed
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
