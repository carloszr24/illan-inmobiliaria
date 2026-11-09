/**
 * Limitador de intentos en memoria (login del admin y formularios públicos).
 * Sin dependencias externas. Se reinicia al reiniciar el servidor, y con varias instancias
 * cada una cuenta por separado: suficiente para una web de una sola agencia.
 */

export type RateLimitOptions = {
  maxAttempts: number
  windowMinutes: number
  blockMinutes: number
}

type Entry = { windowStart: number; attempts: number; blockedUntil: number }

const globalForLimiter = globalThis as unknown as { __illanRateLimits?: Map<string, Entry> }
const entries = (globalForLimiter.__illanRateLimits ??= new Map<string, Entry>())

function sweep(now: number) {
  if (entries.size < 500) return
  for (const [key, entry] of entries) {
    if (entry.blockedUntil < now && now - entry.windowStart > 24 * 60 * 60 * 1000) entries.delete(key)
  }
}

/** Registra un intento. Devuelve si está permitido y, si no, hasta cuándo está bloqueado. */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): { allowed: boolean; retryAfter?: Date } {
  const now = Date.now()
  sweep(now)
  const windowMs = options.windowMinutes * 60 * 1000
  let entry = entries.get(key)

  if (entry && entry.blockedUntil > now) {
    return { allowed: false, retryAfter: new Date(entry.blockedUntil) }
  }

  if (!entry || now - entry.windowStart > windowMs) {
    entry = { windowStart: now, attempts: 0, blockedUntil: 0 }
  }

  entry.attempts += 1
  if (entry.attempts > options.maxAttempts) {
    entry.blockedUntil = now + options.blockMinutes * 60 * 1000
    entries.set(key, entry)
    return { allowed: false, retryAfter: new Date(entry.blockedUntil) }
  }

  entries.set(key, entry)
  return { allowed: true }
}

export function isRateLimitBlocked(key: string): { blocked: boolean; retryAfter?: Date } {
  const entry = entries.get(key)
  if (entry && entry.blockedUntil > Date.now()) {
    return { blocked: true, retryAfter: new Date(entry.blockedUntil) }
  }
  return { blocked: false }
}

export function resetRateLimit(key: string): void {
  entries.delete(key)
}
