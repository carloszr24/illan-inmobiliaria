import { NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME } from '@/lib/admin-auth'
import { getAdminCookieOptions } from '@/lib/admin-security'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE_NAME, '', getAdminCookieOptions(0))
  return res
}
