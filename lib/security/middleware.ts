import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAuditLog, checkRateLimit, POLL_LIMITS } from '@/lib/validations/poll'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Security headers
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'",
}

// IP extraction utility
export const getClientIP = (request: NextRequest): string => {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const connectionIP = request.headers.get('x-forwarded-for')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  if (connectionIP) {
    return connectionIP
  }

  return request.ip || 'unknown'
}

// Rate limiting middleware
export const applyRateLimit = (
  userId: string,
  action: string,
  windowMinutes: number = 60
): { allowed: boolean; reason?: string } => {
  const key = `${userId}:${action}`
  const now = Date.now()
  const windowMs = windowMinutes * 60 * 1000

  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true }
  }

  entry.count++

  return checkRateLimit(userId, action, entry.count, windowMinutes)
}

// Authentication middleware
export const requireAuth = async (request: NextRequest) => {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: securityHeaders }
      )
    }

    return user
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401, headers: securityHeaders }
    )
  }
}

// Authorization middleware
export const requirePollOwnership = async (
  pollId: string,
  userId: string
): Promise<{ authorized: boolean; error?: NextResponse }> => {
  try {
    const supabase = await createClient()
    const { data: poll, error } = await supabase
      .from('polls')
      .select('creator_id')
      .eq('id', pollId)
      .single()

    if (error || !poll) {
      return {
        authorized: false,
        error: NextResponse.json(
          { error: 'Poll not found' },
          { status: 404, headers: securityHeaders }
        )
      }
    }

    if (poll.creator_id !== userId) {
      return {
        authorized: false,
        error: NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403, headers: securityHeaders }
        )
      }
    }

    return { authorized: true }
  } catch (error) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: 'Authorization check failed' },
        { status: 500, headers: securityHeaders }
      )
    }
  }
}

// Audit logging middleware
export const logSecurityEvent = async (
  userId: string,
  action: any,
  request: NextRequest,
  resourceId?: string,
  metadata?: Record<string, string>
) => {
  try {
    const ip = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const auditLog = createAuditLog(
      userId,
      action,
      ip,
      userAgent,
      resourceId,
      metadata
    )

    // In production, save to database or external logging service
    console.log('Security Event:', auditLog)

    // Optionally save to Supabase
    const supabase = await createClient()
    await supabase.from('audit_logs').insert(auditLog)
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

// CSRF protection
export const validateCSRF = (request: NextRequest): boolean => {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')

  if (!origin && !referer) {
    return false
  }

  const allowedOrigins = [
    `https://${host}`,
    `http://${host}`, // Only for development
  ]

  if (origin && !allowedOrigins.includes(origin)) {
    return false
  }

  if (referer) {
    const refererUrl = new URL(referer)
    if (!allowedOrigins.includes(refererUrl.origin)) {
      return false
    }
  }

  return true
}

// Request size limiting
export const validateRequestSize = async (
  request: NextRequest,
  maxSizeBytes: number = 1024 * 1024 // 1MB default
): Promise<{ valid: boolean; error?: NextResponse }> => {
  const contentLength = request.headers.get('content-length')

  if (contentLength && parseInt(contentLength) > maxSizeBytes) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: 'Request payload too large' },
        { status: 413, headers: securityHeaders }
      )
    }
  }

  return { valid: true }
}

// Input validation middleware
export const validateInput = (data: any): { valid: boolean; errors?: string[] } => {
  const errors: string[] = []

  // Check for null bytes
  const checkForNullBytes = (value: string) => {
    if (value.includes('\0')) {
      errors.push('Null bytes are not allowed')
    }
  }

  // Recursively validate object
  const validate = (obj: any, path: string = '') => {
    if (typeof obj === 'string') {
      checkForNullBytes(obj)

      // Check for excessively long strings
      if (obj.length > 10000) {
        errors.push(`String too long at ${path}`)
      }
    } else if (Array.isArray(obj)) {
      if (obj.length > 1000) {
        errors.push(`Array too large at ${path}`)
      }
      obj.forEach((item, index) => validate(item, `${path}[${index}]`))
    } else if (obj && typeof obj === 'object') {
      const keys = Object.keys(obj)
      if (keys.length > 100) {
        errors.push(`Object has too many properties at ${path}`)
      }
      keys.forEach(key => validate(obj[key], path ? `${path}.${key}` : key))
    }
  }

  validate(data)

  return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined }
}

// Apply security middleware for API routes
export const applySecurityMiddleware = async (
  request: NextRequest,
  options: {
    rateLimitKey?: string
    maxRequests?: number
    windowMs?: number
    maxRequestSize?: number
    requireCSRF?: boolean
  } = {}
): Promise<{ allowed: boolean; reason?: string; user?: any }> => {
  try {
    // Validate request size
    if (options.maxRequestSize) {
      const contentLength = request.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > options.maxRequestSize) {
        return { allowed: false, reason: 'Request payload too large' }
      }
    }

    // CSRF protection
    if (options.requireCSRF && !validateCSRF(request)) {
      return { allowed: false, reason: 'CSRF validation failed' }
    }

    // Rate limiting
    if (options.rateLimitKey && options.maxRequests && options.windowMs) {
      const ip = getClientIP(request)
      const key = `${options.rateLimitKey}:${ip}`
      const now = Date.now()

      const entry = rateLimitStore.get(key)

      if (!entry || now > entry.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + options.windowMs })
      } else {
        entry.count++
        if (entry.count > options.maxRequests) {
          return { allowed: false, reason: 'Too many requests' }
        }
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error('Security middleware error:', error)
    return { allowed: false, reason: 'Security check failed' }
  }
}

// Security middleware wrapper
export const withSecurity = (
  handler: (request: NextRequest, context: any) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean
    rateLimit?: { action: string; windowMinutes?: number }
    maxRequestSize?: number
    requireCSRF?: boolean
  } = {}
) => {
  return async (request: NextRequest, context: any) => {
    try {
      // Apply security headers
      const response = NextResponse.next()
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      // Validate request size
      if (options.maxRequestSize) {
        const sizeCheck = await validateRequestSize(request, options.maxRequestSize)
        if (!sizeCheck.valid) {
          return sizeCheck.error!
        }
      }

      // CSRF protection
      if (options.requireCSRF && !validateCSRF(request)) {
        return NextResponse.json(
          { error: 'CSRF validation failed' },
          { status: 403, headers: securityHeaders }
        )
      }

      // Authentication
      let user = null
      if (options.requireAuth) {
        const authResult = await requireAuth(request)
        if (authResult instanceof NextResponse) {
          return authResult
        }
        user = authResult
      }

      // Rate limiting
      if (options.rateLimit && user) {
        const rateLimitResult = applyRateLimit(
          user.id,
          options.rateLimit.action,
          options.rateLimit.windowMinutes
        )

        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            { error: rateLimitResult.reason },
            { status: 429, headers: securityHeaders }
          )
        }
      }

      // Add user to context
      const enhancedContext = { ...context, user }

      return await handler(request, enhancedContext)
    } catch (error) {
      console.error('Security middleware error:', error)
      return NextResponse.json(
        { error: 'Internal security error' },
        { status: 500, headers: securityHeaders }
      )
    }
  }
}
