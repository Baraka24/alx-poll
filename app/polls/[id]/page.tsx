import { PollDetail } from '@/components/polls/poll-detail'
import { PollVoting } from '@/components/polls/poll-voting'
import { PollComments } from '@/components/polls/poll-comments'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface PollPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PollPage({ params }: PollPageProps) {
  const { id } = await params
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/polls">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Polls
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PollDetail pollId={id} />
          <div className="mt-6">
            <PollComments pollId={id} />
          </div>
        </div>

        <aside>
          <PollVoting pollId={id} />
        </aside>
      </div>
    </div>
  )
}
