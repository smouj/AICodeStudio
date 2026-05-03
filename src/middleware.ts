import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// AICodeStudio API Middleware
//
// Protects API routes when the server is publicly exposed:
//   1. Rate limiting (in-memory, per-IP, sliding window)
//   2. API key authentication (optional, via AICODE_API_KEY env var)
//   3. CORS headers for cross-origin requests
//   4. Security headers on all responses
//
// When AICODE_API_KEY is NOT set, the API is open (development mode).
// When AICODE_API_KEY IS set, all /api/* requests require X-API-Key header.
//
// Rate limiting is always active to prevent abuse.
// ---------------------------------------------------------------------------

// ─── Configuration ──────────────────────────────────────────────────────────

const API_KEY = process.env.AICODE_API_KEY || ''
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60 // requests per window per IP
const RATE_LIMIT_MAX_WRITE = 20 // POST/PUT/DELETE per window per IP

// ─── In-Memory Rate Limit Store ─────────────────────────────────────────────

interface RateBucket {
  count: number
  writeCount: number
  resetAt: number
}

const rateLimits = new Map<string, RateBucket>()

// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60_000
let lastCleanup = Date.now()

function cleanupRateLimits() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, bucket] of rateLimits) {
    if (now > bucket.resetAt) {
      rateLimits.delete(key)
    }
  }
}

function checkRateLimit(ip: string, isWrite: boolean): { allowed: boolean; retryAfterMs?: number } {
  cleanupRateLimits()

  const now = Date.now()
  let bucket = rateLimits.get(ip)

  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, writeCount: 0, resetAt: now + RATE_LIMIT_WINDOW_MS }
    rateLimits.set(ip, bucket)
  }

  bucket.count++
  if (isWrite) bucket.writeCount++

  if (bucket.count > RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now }
  }

  if (isWrite && bucket.writeCount > RATE_LIMIT_MAX_WRITE) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now }
  }

  return { allowed: true }
}

// ─── Security Headers ───────────────────────────────────────────────────────

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '0', // Deprecated, but some browsers still use it
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(self), geolocation=()',
}

// ─── Middleware ──────────────────────────────────────────────────────────────

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only apply to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // ── 1. API Key Authentication ──
  if (API_KEY) {
    const providedKey = req.headers.get('x-api-key')
    if (providedKey !== API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide a valid X-API-Key header.' },
        { status: 401 }
      )
    }
  }

  // ── 2. Rate Limiting ──
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'

  const isWrite = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)
  const rateCheck = checkRateLimit(ip, isWrite)

  if (!rateCheck.allowed) {
    const retryAfter = Math.ceil((rateCheck.retryAfterMs || 60000) / 1000)
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please slow down.', retryAfter },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          ...SECURITY_HEADERS,
        },
      }
    )
  }

  // ── 3. CORS ──
  const origin = req.headers.get('origin')
  const isAllowedOrigin = !origin
    || origin === new URL(req.url).origin
    || (process.env.AICODE_CORS_ORIGINS && process.env.AICODE_CORS_ORIGINS.split(',').includes(origin))

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': isAllowedOrigin ? (origin || '*') : '',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
        'Access-Control-Max-Age': '86400',
        ...SECURITY_HEADERS,
      },
    })
  }

  // ── 4. Proceed with security headers ──
  const response = NextResponse.next()

  // Apply security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }

  // Set rate limit headers for client awareness
  response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS))
  response.headers.set('X-RateLimit-Remaining', String(Math.max(0, RATE_LIMIT_MAX_REQUESTS - (rateLimits.get(ip)?.count || 0))))

  if (isAllowedOrigin && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key')
  }

  return response
}

// ─── Matcher ────────────────────────────────────────────────────────────────

export const config = {
  matcher: ['/api/:path*'],
}
