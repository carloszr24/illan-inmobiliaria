import { NextResponse } from 'next/server'
import { getAdminTokenFromRequest, isAdminAuthConfigured, verifyAdminSessionToken } from '@/lib/admin-auth'

export async function GET(request: Request) {
  return NextResponse.json({
    authed: verifyAdminSessionToken(getAdminTokenFromRequest(request)),
    configured: isAdminAuthConfigured(),
  })
}
