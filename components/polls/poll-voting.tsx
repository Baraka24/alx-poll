'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { usePoll, usePollVotes, useVote } from '@/lib/hooks/use-polls'
import Link from 'next/link'

interface PollOption {
  id: number
  text: string
}

interface PollVotingProps {
  pollId: string
}

export function PollVoting({ pollId }: PollVotingProps) {
  const { user, loading: authLoading } = useAuth()
  const { data: poll, isLoading: pollLoading, error: pollError } = usePoll(pollId)
  const { data: votes, isLoading: votesLoading } = usePollVotes(pollId)
  const voteMutation = useVote()
  
  const [selectedOptions, setSelectedOptions] = useState<number[]>([])
  const [userHasVoted, setUserHasVoted] = useState(false)
  const [userVoteOptions, setUserVoteOptions] = useState<number[]>([])

  // Check if current user has voted
  useEffect(() => {
    if (votes && user) {
      const userVotes = votes.filter(vote => vote.user_id === user.id)
      if (userVotes.length > 0) {
        setUserHasVoted(true)
        // Get all option IDs from all user votes (in case of multiple votes)
        const allUserVoteOptions = userVotes.flatMap(vote => vote.option_ids)
        setUserVoteOptions(allUserVoteOptions)
      } else {
        setUserHasVoted(false)
        setUserVoteOptions([])
      }
    }
  }, [votes, user])

  // Calculate vote statistics
  const voteStats = poll?.options ? (poll.options as PollOption[]).map((option: PollOption) => {
    const optionVotes = votes?.filter(vote => 
      vote.option_ids.includes(option.id)
    ).length || 0
    
    const totalVotes = votes?.length || 0
    const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0
    
    return {
      ...option,
      votes: optionVotes,
      percentage: Math.round(percentage * 10) / 10
    }
  }) : []

  const handleOptionSelect = (optionId: number) => {
    if (!user) return
    if (userHasVoted && !poll?.allows_multiple_votes) return

    if (poll?.allows_multiple_votes) {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      )
    } else {
      setSelectedOptions([optionId])
    }
  }

  const handleSubmitVote = async () => {
    if (selectedOptions.length === 0 || !user) return

    try {
      await voteMutation.mutateAsync({
        pollId,
        optionIds: selectedOptions
      })
      
      // For single-vote polls, mark as voted and show the vote
      if (!poll?.allows_multiple_votes) {
        setUserHasVoted(true)
        setUserVoteOptions(selectedOptions)
      } else {
        // For multiple-vote polls, add to existing votes but allow more voting
        setUserVoteOptions(prev => [...prev, ...selectedOptions])
      }
      
      setSelectedOptions([])
    } catch (error) {
      console.error('Error submitting vote:', error)
    }
  }

  const isPollExpired = poll?.expires_at ? new Date(poll.expires_at) <= new Date() : false
  const totalVotes = votes?.length || 0

  // Loading states
  if (authLoading || pollLoading || votesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading poll...</span>
        </CardContent>
      </Card>
    )
  }

  // Error states
  if (pollError || !poll) {
    return (
      <Card>
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load poll data. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vote on this Poll</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to be logged in to vote on this poll.{' '}
              <Link href="/login" className="underline hover:text-blue-600">
                Sign in here
              </Link>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Poll expired
  if (isPollExpired) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Poll Results</CardTitle>
          <p className="text-sm text-gray-600">This poll has ended</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {voteStats.map((option) => (
            <div key={option.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{option.text}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{option.votes} votes</Badge>
                  <span className="text-sm text-gray-600">{option.percentage}%</span>
                </div>
              </div>
              <Progress value={option.percentage} className="h-2" />
            </div>
          ))}
          <div className="pt-4 text-center border-t">
            <p className="text-sm text-gray-600">
              Total votes: <strong>{totalVotes}</strong>
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{userHasVoted ? 'Your Vote & Results' : 'Cast Your Vote'}</CardTitle>
        {poll?.allows_multiple_votes && !userHasVoted && (
          <p className="text-sm text-gray-600">You can select multiple options</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {voteMutation.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {voteMutation.error instanceof Error 
                ? voteMutation.error.message 
                : 'Failed to submit vote. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        {voteStats.map((option) => (
          <div key={option.id} className="space-y-2">
            <div
              className={`p-3 border rounded-lg transition-colors ${
                (userHasVoted && !poll?.allows_multiple_votes)
                  ? 'cursor-default'
                  : selectedOptions.includes(option.id)
                  ? 'border-blue-500 bg-blue-50 cursor-pointer'
                  : 'border-gray-200 hover:border-gray-300 cursor-pointer'
              }`}
              onClick={() => handleOptionSelect(option.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedOptions.includes(option.id) || userVoteOptions.includes(option.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {(selectedOptions.includes(option.id) || userVoteOptions.includes(option.id)) && (
                      <Check className="h-2.5 w-2.5 text-white" />
                    )}
                  </div>
                  <span className="font-medium">{option.text}</span>
                  {userVoteOptions.includes(option.id) && (
                    <Badge variant="outline" className="text-xs">Your choice</Badge>
                  )}
                </div>
                {userHasVoted && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {option.votes} votes
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {option.percentage}%
                    </span>
                  </div>
                )}
              </div>

              {userHasVoted && (
                <div className="mt-2">
                  <Progress value={option.percentage} className="h-2" />
                </div>
              )}
            </div>
          </div>
        ))}

        {(!userHasVoted || poll?.allows_multiple_votes) && (
          <div className="pt-4">
            <Button
              onClick={handleSubmitVote}
              disabled={selectedOptions.length === 0 || voteMutation.isPending}
              className="w-full"
            >
              {voteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Vote'
              )}
            </Button>
          </div>
        )}

        {userHasVoted && (
          <div className="pt-4 text-center border-t">
            <p className="text-sm text-gray-600">
              Thank you for voting! Total votes: <strong>{totalVotes}</strong>
            </p>
            {poll?.allows_multiple_votes && (
              <p className="text-xs text-gray-500 mt-1">
                You can vote again since multiple votes are allowed
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
