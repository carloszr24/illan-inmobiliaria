import { isSupabaseConfigured, supabase } from '@/lib/store/supabase'

/**
 * Limitador de intentos (login del admin y formularios públicos).
 *
 * - Con Supabase: contador PERSISTENTE y atómico (funciones rate_limit_* de supabase/schema.sql).
 *   Es lo que hace falta en hosting serverless (Vercel), donde cada petición puede caer en una instancia distinta.
 * - Sin Supabase, o si Supabase falla: contador en memoria. Se reinicia al reiniciar y cada instancia cuenta
 *   por separado, pero evita dejar el login sin ninguna protección.
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

function memoryHit(key: string, options: RateLimitOptions): { allowed: boolean; retryAfter?: Date } {
  const now = Date.now()
  sweep(now)
  const windowMs = options.windowMinutes * 60 * 1000
  let entry = entries.get(key)

  if (entry && entry.blockedUntil > now) return { allowed: false, retryAfter: new Date(entry.blockedUntil) }

  if (!entry || now - entry.windowStart > windowMs) entry = { windowStart: now, attempts: 0, blockedUntil: 0 }

  entry.attempts += 1
  if (entry.attempts > options.maxAttempts) {
    entry.blockedUntil = now + options.blockMinutes * 60 * 1000
    entries.set(key, entry)
    return { allowed: false, retryAfter: new Date(entry.blockedUntil) }
  }
  entries.set(key, entry)
  return { allowed: true }
}

/** Registra un intento. Devuelve si está permitido y, si no, hasta cuándo está bloqueado. */
export async function checkRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<{ allowed: boolean; retryAfter?: Date }> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase().rpc('rate_limit_hit', {
        p_key: key,
        p_max: options.maxAttempts,
        p_window_minutes: options.windowMinutes,
        p_block_minutes: options.blockMinutes,
      })
      if (error) throw error
      const row = (Array.isArray(data) ? data[0] : data) as { allowed?: boolean; retry_after?: string | null } | null
      if (row && row.allowed === false) {
        return { allowed: false, retryAfter: row.retry_after ? new Date(row.retry_after) : undefined }
      }
      return { allowed: true }
    } catch (error) {
      console.error('[rate-limit] Supabase no responde; se usa el contador en memoria:', error)
    }
  }
  return memoryHit(key, options)
}

export async function isRateLimitBlocked(key: string): Promise<{ blocked: boolean; retryAfter?: Date }> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase().rpc('rate_limit_blocked', { p_key: key })
      if (error) throw error
      if (typeof data === 'string' && data) return { blocked: true, retryAfter: new Date(data) }
      return { blocked: false }
    } catch (error) {
      console.error('[rate-limit] Supabase no responde; se consulta el contador en memoria:', error)
    }
  }
  const entry = entries.get(key)
  if (entry && entry.blockedUntil > Date.now()) return { blocked: true, retryAfter: new Date(entry.blockedUntil) }
  return { blocked: false }
}

export async function resetRateLimit(key: string): Promise<void> {
  entries.delete(key)
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase().rpc('rate_limit_reset', { p_key: key })
      if (error) throw error
    } catch (error) {
      console.error('[rate-limit] No se pudo reiniciar el contador en Supabase:', error)
    }
  }
}
