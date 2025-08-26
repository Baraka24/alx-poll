'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { Eye, MessageCircle, Users } from 'lucide-react'

// Mock data - replace with actual API call
const mockPolls = [
  {
    id: '1',
    title: 'What\'s your favorite programming language?',
    description: 'Help us understand the developer community preferences.',
    author: {
      name: 'John Doe',
      avatar: '/avatars/john.jpg'
    },
    category: 'Technology',
    participants: 245,
    comments: 42,
    views: 1250,
    createdAt: '2024-01-15',
    isActive: true
  },
  {
    id: '2',
    title: 'Best coffee shop in the city?',
    description: 'Looking for recommendations for great coffee spots.',
    author: {
      name: 'Jane Smith',
      avatar: '/avatars/jane.jpg'
    },
    category: 'Food & Drink',
    participants: 89,
    comments: 23,
    views: 567,
    createdAt: '2024-01-14',
    isActive: true
  },
  {
    id: '3',
    title: 'Remote work vs Office work?',
    description: 'What works better for productivity and work-life balance?',
    author: {
      name: 'Mike Johnson',
      avatar: '/avatars/mike.jpg'
    },
    category: 'Work',
    participants: 342,
    comments: 78,
    views: 2100,
    createdAt: '2024-01-13',
    isActive: false
  }
]

export function PollGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      {mockPolls.map((poll) => (
        <Card key={poll.id} className="transition-all hover:shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={poll.isActive ? "default" : "secondary"}>
                    {poll.isActive ? 'Active' : 'Closed'}
                  </Badge>
                  <Badge variant="outline">{poll.category}</Badge>
                </div>
                <CardTitle className="text-lg leading-tight">
                  {poll.title}
                </CardTitle>
                <CardDescription className="mt-2">
                  {poll.description}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={poll.author.avatar} />
                <AvatarFallback>
                  {poll.author.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {poll.author.name}
              </span>
              <span className="text-sm text-muted-foreground">
                · {poll.createdAt}
              </span>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {poll.participants}
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  {poll.comments}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {poll.views}
                </div>
              </div>

              <Link href={`/polls/${poll.id}`}>
                <Button size="sm">
                  {poll.isActive ? 'Vote Now' : 'View Results'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
