import { NextResponse } from 'next/server'
import { getAdminTokenFromRequest, isAdminAuthConfigured, verifyAdminSessionToken } from '@/lib/admin-auth'
import { isPersistentStore } from '@/lib/store/json-store'

export async function GET(request: Request) {
  const authed = verifyAdminSessionToken(getAdminTokenFromRequest(request))
  return NextResponse.json({
    authed,
    configured: isAdminAuthConfigured(),
    // Solo se revela con sesión iniciada. false = modo demostración (los cambios no se guardan).
    ...(authed ? { persistent: isPersistentStore() } : {}),
  })
}
