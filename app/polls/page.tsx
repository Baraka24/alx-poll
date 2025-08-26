import { PollGrid } from '@/components/polls/poll-grid'
import { CreatePollButton } from '@/components/polls/create-poll-button'
import { PollFilters } from '@/components/polls/poll-filters'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function PollsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Polls</h1>
          <p className="text-muted-foreground">
            Discover and participate in interesting polls
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/polls/create">
            <Button>Create Poll</Button>
          </Link>
        </div>
      </div>

      {/* Mobile filters - shown at top on small screens */}
      <div className="lg:hidden mb-6">
        <PollFilters />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Desktop sidebar filters */}
        <aside className="hidden lg:block lg:w-80 xl:w-96">
          <div className="sticky top-4">
            <PollFilters />
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <PollGrid />
        </main>
      </div>
    </div>
  )
}
