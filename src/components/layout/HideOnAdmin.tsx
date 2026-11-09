'use client'

import { usePathname } from 'next/navigation'

/** Oculta a sus hijos (pie de página de la web) dentro del panel /admin. */
export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return null
  return <>{children}</>
}
