'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin', label: 'Propiedades' },
  { href: '/admin/leads', label: 'Contactos' },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="ml-2 flex items-center gap-1 md:ml-6" aria-label="Administración">
      {links.map((link) => {
        const active = pathname === link.href
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-md px-3.5 py-2 text-sm font-medium transition-colors',
              active ? 'bg-brand-yellow text-brand-green-deep' : 'text-white/80 hover:bg-white/10 hover:text-white'
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
