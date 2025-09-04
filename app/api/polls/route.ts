import { createClient } from '@/lib/supabase/server'
import { createPollSchema, validatePollFilter, sanitizeHtml, validateContentSecurity } from '@/lib/validations/poll'
import { generateQRCodeForPoll } from '@/lib/utils/qr-code'
import { NextRequest, NextResponse } from 'next/server'
import {
  withSecurity,
  logSecurityEvent,
  validateInput,
  securityHeaders
} from '@/lib/security/middleware'

async function getPolls(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { searchParams } = new URL(request.url)

    // Validate and sanitize query parameters
    const queryParams = {
      userId: searchParams.get('userId'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    }

    // Validate input parameters
    const inputValidation = validateInput(queryParams)
    if (!inputValidation.valid) {
      return NextResponse.json(
        { error: 'Invalid input parameters', details: inputValidation.errors },
        { status: 400, headers: securityHeaders }
      )
    }

    // Validate with schema
    const filterValidation = validatePollFilter(queryParams)
    if (!filterValidation.success) {
      return NextResponse.json(
        { error: 'Invalid filter parameters' },
        { status: 400, headers: securityHeaders }
      )
    }

    const validatedParams = filterValidation.data

    let query = supabase
      .from('polls')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(
        (validatedParams.page - 1) * validatedParams.limit,
        validatedParams.page * validatedParams.limit - 1
      )

    // Only allow users to query their own polls
    if (validatedParams.createdBy && user?.id === validatedParams.createdBy) {
      query = query.eq('creator_id', validatedParams.createdBy)
    }

    if (validatedParams.search) {
      // Sanitize search input
      const sanitizedSearch = sanitizeHtml(validatedParams.search)
      query = query.ilike('title', `%${sanitizedSearch}%`)
    }

    if (validatedParams.status === 'active') {
      query = query.gt('expires_at', new Date().toISOString())
    } else if (validatedParams.status === 'expired') {
      query = query.lt('expires_at', new Date().toISOString())
    }

    const { data: polls, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch polls' },
        { status: 500, headers: securityHeaders }
      )
    }

    return NextResponse.json(polls, { headers: securityHeaders })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: securityHeaders }
    )
  }
}

async function createPoll(request: NextRequest, context: { user: any }) {
  try {
    const supabase = await createClient()
    const { user } = context

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: securityHeaders }
      )
    }

    const body = await request.json()

    // Validate input structure
    const inputValidation = validateInput(body)
    if (!inputValidation.valid) {
      await logSecurityEvent(
        user.id,
        'create_poll',
        request,
        undefined,
        { error: 'Invalid input', details: inputValidation.errors?.join(', ') || 'Unknown validation error' }
      )
      return NextResponse.json(
        { error: 'Invalid input data', details: inputValidation.errors },
        { status: 400, headers: securityHeaders }
      )
    }

    // Validate with schema
    const validationResult = createPollSchema.safeParse(body)
    if (!validationResult.success) {
      await logSecurityEvent(
        user.id,
        'create_poll',
        request,
        undefined,
        { error: 'Schema validation failed', details: validationResult.error.message }
      )
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400, headers: securityHeaders }
      )
    }

    const validatedData = validationResult.data

    // Additional content security validation
    const titleSecurity = validateContentSecurity(validatedData.title)
    if (!titleSecurity.isValid) {
      await logSecurityEvent(
        user.id,
        'create_poll',
        request,
        undefined,
        { error: 'Security validation failed', reason: titleSecurity.reason || 'Unknown security issue' }
      )
      return NextResponse.json(
        { error: 'Content security violation', reason: titleSecurity.reason },
        { status: 400, headers: securityHeaders }
      )
    }

    if (validatedData.description) {
      const descSecurity = validateContentSecurity(validatedData.description)
      if (!descSecurity.isValid) {
        await logSecurityEvent(
          user.id,
          'create_poll',
          request,
          undefined,
          { error: 'Security validation failed', reason: descSecurity.reason || 'Unknown security issue' }
        )
        return NextResponse.json(
          { error: 'Content security violation', reason: descSecurity.reason },
          { status: 400, headers: securityHeaders }
        )
      }
    }

    // Validate each option
    for (const option of validatedData.options) {
      const optionSecurity = validateContentSecurity(option.text)
      if (!optionSecurity.isValid) {
        await logSecurityEvent(
          user.id,
          'create_poll',
          request,
          undefined,
          { error: 'Option security validation failed', reason: optionSecurity.reason || 'Unknown security issue' }
        )
        return NextResponse.json(
          { error: 'Content security violation in option', reason: optionSecurity.reason },
          { status: 400, headers: securityHeaders }
        )
      }
    }

    // Create poll with sanitized data
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: sanitizeHtml(validatedData.title),
        description: validatedData.description ? sanitizeHtml(validatedData.description) : null,
        options: validatedData.options.map(opt => ({
          ...opt,
          text: sanitizeHtml(opt.text)
        })),
        creator_id: user.id,
        is_public: validatedData.isPublic,
        allows_multiple_votes: validatedData.allowsMultipleVotes,
        expires_at: validatedData.expiresAt,
      } as any)
      .select()
      .single()

    if (pollError) {
      console.error('Database error:', pollError)
      await logSecurityEvent(
        user.id,
        'create_poll',
        request,
        undefined,
        { error: 'Database error', details: pollError.message }
      )
      return NextResponse.json(
        { error: 'Failed to create poll' },
        { status: 500, headers: securityHeaders }
      )
    }

    // Generate QR code (non-blocking)
    try {
      const qrCodeDataURL = await generateQRCodeForPoll((poll as any)?.id)

      // Update poll with QR code URL
      const { error: updateError } = await (supabase as any)
        .from('polls')
        .update({ qr_code_url: qrCodeDataURL })
        .eq('id', (poll as any)?.id)

      if (updateError) {
        console.error('Failed to update QR code:', updateError)
      }
    } catch (qrError) {
      console.error('Failed to generate QR code:', qrError)
      // Don't fail the request for QR code errors
    }

    // Log successful poll creation
    await logSecurityEvent(
      user.id,
      'create_poll',
      request,
      (poll as any)?.id,
      {
        title: (poll as any)?.title || 'Unknown',
        options_count: (poll as any)?.options?.length?.toString() || '0'
      }
    )

    return NextResponse.json(poll, { status: 201, headers: securityHeaders })
  } catch (error) {
    console.error('Unexpected error:', error)

    if (context.user) {
      await logSecurityEvent(
        context.user.id,
        'create_poll',
        request,
        undefined,
        { error: 'Unexpected error', details: error instanceof Error ? error.message : 'Unknown error' }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: securityHeaders }
    )
  }
}

// Apply security middleware
export const GET = withSecurity(getPolls, {
  maxRequestSize: 10 * 1024, // 10KB for GET requests
  requireCSRF: false, // GET requests don't need CSRF protection
})

export const POST = withSecurity(createPoll, {
  requireAuth: true,
  rateLimit: { action: 'create_poll', windowMinutes: 60 },
  maxRequestSize: 100 * 1024, // 100KB for POST requests
  requireCSRF: true,
})
