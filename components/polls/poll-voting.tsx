'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Check } from 'lucide-react'

interface PollOption {
  id: string
  text: string
  votes: number
  percentage: number
}

interface PollVotingProps {
  pollId?: string
  options?: PollOption[]
  hasVoted?: boolean
  allowMultiple?: boolean
}

export function PollVoting({
  pollId = '1',
  options,
  hasVoted = false,
  allowMultiple = false
}: PollVotingProps) {
  // Mock data for development
  const mockOptions: PollOption[] = [
    { id: '1', text: 'Pizza', votes: 15, percentage: 35.7 },
    { id: '2', text: 'Sushi', votes: 12, percentage: 28.6 },
    { id: '3', text: 'Burgers', votes: 10, percentage: 23.8 },
    { id: '4', text: 'Salads', votes: 5, percentage: 11.9 }
  ]

  const currentOptions = options || mockOptions
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [userHasVoted, setUserHasVoted] = useState(hasVoted)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOptionSelect = (optionId: string) => {
    if (userHasVoted) return

    if (allowMultiple) {
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
    if (selectedOptions.length === 0) return

    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    setUserHasVoted(true)
    setIsSubmitting(false)

    // In a real app, you would make an API call here
    console.log('Voting for options:', selectedOptions)
  }

  const totalVotes = currentOptions.reduce((sum, option) => sum + option.votes, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cast Your Vote</CardTitle>
        {allowMultiple && (
          <p className="text-sm text-gray-600">You can select multiple options</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {currentOptions.map((option) => (
          <div key={option.id} className="space-y-2">
            <div
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                userHasVoted
                  ? 'cursor-default'
                  : selectedOptions.includes(option.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleOptionSelect(option.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedOptions.includes(option.id) || userHasVoted
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {(selectedOptions.includes(option.id) || userHasVoted) && (
                      <Check className="h-2.5 w-2.5 text-white" />
                    )}
                  </div>
                  <span className="font-medium">{option.text}</span>
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

        {!userHasVoted && (
          <div className="pt-4">
            <Button
              onClick={handleSubmitVote}
              disabled={selectedOptions.length === 0 || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Vote'}
            </Button>
          </div>
        )}

        {userHasVoted && (
          <div className="pt-4 text-center">
            <p className="text-sm text-gray-600">
              Thank you for voting! Total votes: <strong>{totalVotes}</strong>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
