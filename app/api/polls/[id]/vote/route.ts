import { createClient } from '@/lib/supabase/server'
import { voteSchema } from '@/lib/validations/poll'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = voteSchema.parse({
      pollId: params.id,
      optionIds: body.optionIds,
    })

    // Check if poll exists and is still active
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', params.id)
      .single()

    if (pollError || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Poll has expired' }, { status: 400 })
    }

    // Check if user has already voted (unless multiple votes allowed)
    if (!poll.allows_multiple_votes) {
      const { data: existingVote } = await supabase
        .from('votes')
        .select('id')
        .eq('poll_id', params.id)
        .eq('user_id', user.id)
        .single()

      if (existingVote) {
        return NextResponse.json(
          { error: 'You have already voted on this poll' },
          { status: 400 }
        )
      }
    }

    // Create vote
    const { data: vote, error: voteError } = await supabase
      .from('votes')
      .insert({
        poll_id: params.id,
        user_id: user.id,
        option_ids: validatedData.optionIds,
      })
      .select()
      .single()

    if (voteError) {
      return NextResponse.json({ error: voteError.message }, { status: 500 })
    }

    // Log analytics
    await supabase
      .from('poll_analytics')
      .insert({
        poll_id: params.id,
        event_type: 'vote',
        user_id: user.id,
        metadata: { option_ids: validatedData.optionIds },
      })

    return NextResponse.json(vote, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
