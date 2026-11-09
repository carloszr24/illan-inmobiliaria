'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/brand/Logo'
import { MailIcon, MapPinIcon, PhoneIcon, WhatsAppIcon } from '@/components/brand/Icons'
import { ValoracionGratuitaModal } from '@/components/home/ValoracionGratuitaModal'
import { CONTACT, emailHref, OFFICE, phoneHref, whatsappHref } from '@/lib/contact'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/propiedades', label: 'Propiedades' },
  { href: '/servicios', label: 'Servicios' },
  { href: '/contacto', label: 'Contacto' },
]

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Cierra el menú móvil al cambiar de página
  useEffect(() => setOpen(false), [pathname])

  if (pathname.startsWith('/admin')) return null

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <>
      {/* Barra superior con los datos de la tarjeta */}
      <div className="hidden bg-brand-green-deep text-[13px] text-white/85 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-10 py-2">
          <span className="inline-flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 text-brand-yellow" />
            {OFFICE.full}
          </span>
          <span className="inline-flex items-center gap-6">
            <a href={emailHref} className="inline-flex items-center gap-2 transition-colors hover:text-white">
              <MailIcon className="h-4 w-4 text-brand-yellow" />
              {CONTACT.email}
            </a>
            <a href={phoneHref} className="inline-flex items-center gap-2 font-semibold text-white">
              <PhoneIcon className="h-4 w-4 text-brand-yellow" />
              {CONTACT.phone.display}
            </a>
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b-4 border-brand-yellow bg-brand-green shadow-md">
        <div className="mx-auto flex max-w-7xl items-center px-5 md:px-10">
          <Link href="/" aria-label="ILLAN Inmobiliaria — Inicio" className="shrink-0 py-2.5">
            <Logo className="w-[150px] md:w-[178px]" />
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Principal">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={cn(
                  'rounded-md px-4 py-2 text-[13px] font-semibold uppercase tracking-[0.12em] transition-colors',
                  isActive(link.href)
                    ? 'bg-brand-green-dark text-brand-yellow'
                    : 'text-white/90 hover:bg-brand-green-dark/70 hover:text-white'
                )}
              >
                {link.label}
              </Link>
            ))}
            <ValoracionGratuitaModal
              triggerLabel="Valoración gratuita"
              triggerClassName="btn-accent ml-3 whitespace-nowrap px-5 py-2.5 text-[13px] uppercase tracking-[0.1em]"
            />
          </nav>

          <button
            type="button"
            className="ml-auto rounded-md p-2 text-white md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
          >
            <span className="block w-6 space-y-1.5">
              <span className={cn('block h-0.5 bg-white transition-all duration-300', open && 'translate-y-2 rotate-45')} />
              <span className={cn('block h-0.5 bg-white transition-all duration-300', open && 'opacity-0')} />
              <span className={cn('block h-0.5 bg-white transition-all duration-300', open && '-translate-y-2 -rotate-45')} />
            </span>
          </button>
        </div>

        {open && (
          <div className="border-t border-white/15 bg-brand-green-dark px-5 py-5 md:hidden">
            <nav className="flex flex-col" aria-label="Móvil">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-md px-3 py-3 text-sm font-semibold uppercase tracking-[0.12em]',
                    isActive(link.href) ? 'bg-brand-green text-brand-yellow' : 'text-white/90'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <a href={phoneHref} className="btn-accent gap-2 text-sm">
                <PhoneIcon className="h-4 w-4" /> Llamar
              </a>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-semibold text-brand-green-dark">
                <WhatsAppIcon className="h-4 w-4" /> WhatsApp
              </a>
            </div>
            <ValoracionGratuitaModal
              triggerLabel="Valoración gratuita"
              triggerClassName="mt-3 w-full rounded-md border border-white/40 px-4 py-3 text-sm font-medium text-white"
            />
          </div>
        )}
      </header>
    </>
  )
}
