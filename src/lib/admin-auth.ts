import { createHash, createHmac, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

/**
 * Autenticación del panel /admin.
 * Todo sale de variables de entorno (ver .env.example): no hay contraseñas, PIN ni secretos
 * por defecto en el código. Si faltan, el login queda deshabilitado en vez de usar un valor débil.
 */

export const ADMIN_COOKIE_NAME = 'illan_admin'
const MIN_SECRET_LENGTH = 32

export function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim() || ''
  return secret.length >= MIN_SECRET_LENGTH ? secret : ''
}

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD?.trim() || ''
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(getAdminPassword() && getSessionSecret())
}

export function getAdminSessionMaxAgeSeconds(): number {
  const hours = Number(process.env.ADMIN_SESSION_MAX_AGE_HOURS)
  if (Number.isFinite(hours) && hours > 0 && hours <= 168) return Math.floor(hours * 3600)
  return 12 * 3600
}

function sha256(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest()
}

/** Comparación en tiempo constante (se comparan hashes, así la longitud no se filtra). */
export function verifyAdminPassword(candidate: string): boolean {
  const expected = getAdminPassword()
  if (!expected) return false
  return timingSafeEqual(sha256(candidate), sha256(expected))
}

/** Cambia al cambiar la contraseña: invalida las sesiones antiguas. */
function passwordVersion(): string {
  const secret = getSessionSecret()
  const password = getAdminPassword()
  if (!secret || !password) return ''
  return createHmac('sha256', secret).update(password).digest('base64url').slice(0, 16)
}

export function createAdminSessionToken(): string {
  const secret = getSessionSecret()
  const version = passwordVersion()
  if (!secret || !version) return ''
  const exp = Date.now() + getAdminSessionMaxAgeSeconds() * 1000
  const payload = Buffer.from(JSON.stringify({ exp, v: version }), 'utf8').toString('base64url')
  const sig = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  const secret = getSessionSecret()
  const version = passwordVersion()
  if (!token || !secret || !version) return false

  const dot = token.indexOf('.')
  if (dot === -1) return false
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = createHmac('sha256', secret).update(payload).digest('base64url')

  const a = Buffer.from(sig, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false

  try {
    const { exp, v } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      exp: number
      v: string
    }
    return typeof exp === 'number' && exp > Date.now() && v === version
  } catch {
    return false
  }
}

export function getAdminTokenFromRequest(request: NextRequest | Request): string | undefined {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return undefined
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === ADMIN_COOKIE_NAME) return decodeURIComponent(rest.join('='))
  }
  return undefined
}

/**
 * ¿Es una petición de administrador legítima?
 * Sesión válida + (en métodos que modifican datos) cabecera Origin del mismo sitio.
 */
export function isAdminRequest(request: NextRequest | Request): boolean {
  if (!verifyAdminSessionToken(getAdminTokenFromRequest(request))) return false
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    return new URL(origin).host === request.headers.get('host')
  } catch {
    return false
  }
}
