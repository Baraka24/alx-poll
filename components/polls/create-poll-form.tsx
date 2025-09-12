'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useCreatePoll } from '@/lib/hooks/use-polls'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function CreatePollForm() {
  const { user } = useAuth()
  const router = useRouter()
  const createPollMutation = useCreatePoll()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState([
    { id: 1, text: '' },
    { id: 2, text: '' }
  ])
  const [allowsMultipleVotes, setAllowsMultipleVotes] = useState(false)
  const [isPublic, setIsPublic] = useState(true)

  const addOption = () => {
    const newId = Math.max(...options.map(o => o.id)) + 1
    setOptions([...options, { id: newId, text: '' }])
  }

  const removeOption = (id: number) => {
    if (options.length > 2) {
      setOptions(options.filter(o => o.id !== id))
    }
  }

  const updateOption = (id: number, text: string) => {
    setOptions(options.map(o => o.id === id ? { ...o, text } : o))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    const validOptions = options.filter(o => o.text.trim())
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options')
      return
    }

    try {
      const poll = await createPollMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        options: validOptions,
        isPublic,
        allowsMultipleVotes,
      })

      router.push(`/polls/${poll.id}`)
    } catch (error) {
      console.error('Error creating poll:', error)
    }
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>Please log in to create a poll.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a New Poll</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Poll Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What would you like to ask?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context for your poll..."
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <Label>Poll Options</Label>
            {options.map((option, index) => (
              <div key={option.id} className="flex gap-2">
                <Input
                  value={option.text}
                  onChange={(e) => updateOption(option.id, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  required
                />
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeOption(option.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {options.length < 10 && (
              <Button
                type="button"
                variant="outline"
                onClick={addOption}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowMultiple"
                checked={allowsMultipleVotes}
                onChange={(e) => setAllowsMultipleVotes(e.target.checked)}
              />
              <Label htmlFor="allowMultiple">Allow multiple votes per user</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <Label htmlFor="isPublic">Make this poll public</Label>
            </div>
          </div>

          <Button
            type="submit"
            disabled={createPollMutation.isPending}
            className="w-full"
          >
            {createPollMutation.isPending ? 'Creating Poll...' : 'Create Poll'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
