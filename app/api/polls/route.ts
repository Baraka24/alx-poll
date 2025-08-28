import { createClient } from '@/lib/supabase/server'
import { createPollSchema } from '@/lib/validations/poll'
import { generateQRCodeForPoll } from '@/lib/utils/qr-code'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    let query = supabase
      .from('polls')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (userId && user?.id === userId) {
      query = query.eq('creator_id', userId)
    }

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    if (status === 'active') {
      query = query.gt('expires_at', new Date().toISOString())
    } else if (status === 'closed') {
      query = query.lt('expires_at', new Date().toISOString())
    }

    const { data: polls, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(polls)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createPollSchema.parse(body)

    // Create poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        options: validatedData.options,
        creator_id: user.id,
        is_public: validatedData.isPublic,
        allows_multiple_votes: validatedData.allowsMultipleVotes,
        expires_at: validatedData.expiresAt,
      })
      .select()
      .single()

    if (pollError) {
      return NextResponse.json({ error: pollError.message }, { status: 500 })
    }

    // Generate QR code
    try {
      const qrCodeDataURL = await generateQRCodeForPoll(poll.id)

      // Update poll with QR code URL
      const { error: updateError } = await supabase
        .from('polls')
        .update({ qr_code_url: qrCodeDataURL })
        .eq('id', poll.id)

      if (updateError) {
        console.error('Failed to update QR code:', updateError)
      }
    } catch (qrError) {
      console.error('Failed to generate QR code:', qrError)
    }

    return NextResponse.json(poll, { status: 201 })
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
