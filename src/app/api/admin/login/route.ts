import { NextResponse } from 'next/server'
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  getAdminSessionMaxAgeSeconds,
  isAdminAuthConfigured,
  verifyAdminPassword,
} from '@/lib/admin-auth'
import {
  checkLoginRateLimit,
  clearLoginAttempts,
  getAdminCookieOptions,
  getClientIp,
  isAdminIpAllowed,
  recordLoginFailure,
} from '@/lib/admin-security'

export async function POST(request: Request) {
  if (!isAdminIpAllowed(request)) {
    return NextResponse.json({ error: 'Acceso no permitido' }, { status: 403 })
  }

  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          'El acceso al panel no está configurado. Ejecuta "npm run setup" (o define ADMIN_PASSWORD y ADMIN_SESSION_SECRET) y reinicia el servidor.',
      },
      { status: 503 }
    )
  }

  const ip = getClientIp(request)
  const rate = await checkLoginRateLimit(ip)
  if (!rate.ok) {
    return NextResponse.json(
      { error: `Demasiados intentos. Espera ${Math.ceil(rate.retryAfterSec / 60)} minutos e inténtalo de nuevo.` },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } }
    )
  }

  try {
    const body = await request.json()
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!verifyAdminPassword(password)) {
      await recordLoginFailure(ip)
      return NextResponse.json({ ok: false, error: 'Contraseña incorrecta' }, { status: 401 })
    }

    const token = createAdminSessionToken()
    if (!token) return NextResponse.json({ error: 'Configuración de admin incompleta' }, { status: 503 })

    await clearLoginAttempts(ip)
    const res = NextResponse.json({ ok: true })
    res.cookies.set(ADMIN_COOKIE_NAME, token, getAdminCookieOptions(getAdminSessionMaxAgeSeconds()))
    return res
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
