import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { checkRateLimit, isRateLimitBlocked, resetRateLimit } from '@/lib/rate-limiter'

const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_WINDOW_MINUTES = 15
const LOGIN_BLOCK_MINUTES = 30

const loginKey = (ip: string) => `login:${ip}`

export function getClientIp(request: NextRequest | Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

export function getAllowedAdminIps(): string[] {
  const raw = process.env.ADMIN_ALLOWED_IPS?.trim()
  if (!raw) return []
  return raw
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean)
}

export function isAdminIpAllowed(request: NextRequest | Request): boolean {
  const allowed = getAllowedAdminIps()
  if (allowed.length === 0) return true
  return allowed.includes(getClientIp(request))
}

export function adminSecurityHeaders(): HeadersInit {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store, max-age=0',
  }
}

export function applyAdminSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(adminSecurityHeaders())) response.headers.set(key, value)
  return response
}

export function adminAccessDeniedResponse(status = 403): NextResponse {
  return applyAdminSecurityHeaders(NextResponse.json({ error: 'Acceso no permitido' }, { status }))
}

export function checkLoginRateLimit(ip: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const status = isRateLimitBlocked(loginKey(ip))
  if (!status.blocked || !status.retryAfter) return { ok: true }
  return {
    ok: false,
    retryAfterSec: Math.max(1, Math.ceil((status.retryAfter.getTime() - Date.now()) / 1000)),
  }
}

export function recordLoginFailure(ip: string): void {
  checkRateLimit(loginKey(ip), {
    maxAttempts: MAX_LOGIN_ATTEMPTS,
    windowMinutes: LOGIN_WINDOW_MINUTES,
    blockMinutes: LOGIN_BLOCK_MINUTES,
  })
}

export function clearLoginAttempts(ip: string): void {
  resetRateLimit(loginKey(ip))
}

export function getAdminCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  }
}
