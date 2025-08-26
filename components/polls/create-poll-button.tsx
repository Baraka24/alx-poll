'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export function CreatePollButton() {
  return (
    <Link href="/polls/create">
      <Button className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Create New Poll
      </Button>
    </Link>
  )
}
