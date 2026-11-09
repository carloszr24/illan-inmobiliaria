import { NextRequest, NextResponse } from 'next/server'
import {
  adminAccessDeniedResponse,
  applyAdminSecurityHeaders,
  isAdminIpAllowed,
} from '@/lib/admin-security'

/**
 * Proxy (antes "middleware"): filtro de IP opcional y cabeceras de seguridad para el admin.
 * La comprobación real de sesión se hace en cada API route (isAdminRequest) y en
 * AdminAuthGuard para las páginas /admin/*.
 */
export function proxy(request: NextRequest) {
  if (!isAdminIpAllowed(request)) return adminAccessDeniedResponse(403)
  return applyAdminSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/propiedades/:path*', '/api/uploads/:path*', '/api/leads'],
}
