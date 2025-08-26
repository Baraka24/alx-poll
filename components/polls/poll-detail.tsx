'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, Clock } from 'lucide-react'

interface PollDetailProps {
  poll?: {
    id: string
    title: string
    description: string
    author: string
    createdAt: string
    endDate?: string
    status: 'active' | 'closed' | 'draft'
    totalVotes: number
  }
}

export function PollDetail({ poll }: PollDetailProps) {
  // Mock data for development
  const mockPoll = {
    id: '1',
    title: 'What should we have for lunch?',
    description: 'Help us decide what to order for the team lunch this Friday. We want to make sure everyone gets something they enjoy!',
    author: 'John Doe',
    createdAt: '2025-08-20',
    endDate: '2025-08-30',
    status: 'active' as const,
    totalVotes: 42
  }

  const currentPoll = poll || mockPoll

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-red-100 text-red-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">{currentPoll.title}</CardTitle>
          <Badge className={getStatusColor(currentPoll.status)}>
            {currentPoll.status.charAt(0).toUpperCase() + currentPoll.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-gray-600 leading-relaxed">
          {currentPoll.description}
        </p>

        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Created by {currentPoll.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Created on {new Date(currentPoll.createdAt).toLocaleDateString()}</span>
          </div>
          {currentPoll.endDate && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Ends on {new Date(currentPoll.endDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-gray-500">
            <strong>{currentPoll.totalVotes}</strong> total votes
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
