'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/ui/avatar'
import { MessageSquare, Send } from 'lucide-react'

interface Comment {
  id: string
  author: string
  content: string
  timestamp: string
  avatar?: string
}

interface PollCommentsProps {
  pollId?: string
  comments?: Comment[]
}

export function PollComments({ pollId = '1', comments }: PollCommentsProps) {
  // Mock data for development
  const mockComments: Comment[] = [
    {
      id: '1',
      author: 'Alice Johnson',
      content: 'I think pizza is always a safe choice for team lunches. Everyone usually enjoys it!',
      timestamp: '2025-08-25T10:30:00Z'
    },
    {
      id: '2',
      author: 'Bob Smith',
      content: 'What about dietary restrictions? We should consider vegetarian and gluten-free options.',
      timestamp: '2025-08-25T11:15:00Z'
    },
    {
      id: '3',
      author: 'Carol Davis',
      content: 'Sushi sounds great! There\'s that new place downtown that has good reviews.',
      timestamp: '2025-08-25T14:20:00Z'
    }
  ]

  const currentComments = comments || mockComments
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // In a real app, you would make an API call here
    console.log('Submitting comment:', newComment)

    setNewComment('')
    setIsSubmitting(false)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({currentComments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form */}
        <div className="space-y-3">
          <Textarea
            placeholder="Share your thoughts about this poll..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              size="sm"
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {currentComments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            currentComments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-gray-50">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <div className="h-full w-full bg-blue-500 text-white text-xs font-medium flex items-center justify-center">
                    {getInitials(comment.author)}
                  </div>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.author}</span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(comment.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
