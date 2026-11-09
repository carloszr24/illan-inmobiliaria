import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import { GlobeIcon, MailIcon, MapPinIcon, PhoneIcon, WhatsAppIcon } from '@/components/brand/Icons'
import { AGENT, CONTACT, directionsHref, emailHref, OFFICE, phoneHref, whatsappHref } from '@/lib/contact'

const linkClass = 'transition-colors hover:text-brand-yellow'

export function Footer() {
  return (
    <footer className="border-t-4 border-brand-yellow bg-brand-green-deep text-white/75">
      <div className="mx-auto max-w-7xl px-6 py-14 md:px-10">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo className="w-[210px]" />
            <p className="mt-5 max-w-md text-sm leading-relaxed">
              {AGENT.tagline} Nuestra oficina está en Lugo capital.
            </p>
          </div>

          <div className="md:col-span-3">
            <h4 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.22em] text-brand-yellow">Navegación</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/propiedades" className={linkClass}>Propiedades</Link></li>
              <li><Link href="/servicios" className={linkClass}>Servicios</Link></li>
              <li><Link href="/contacto" className={linkClass}>Contacto</Link></li>
              <li><Link href="/aviso-legal" className={linkClass}>Aviso legal</Link></li>
              <li><Link href="/politica-privacidad" className={linkClass}>Privacidad</Link></li>
              <li><Link href="/politica-cookies" className={linkClass}>Cookies</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.22em] text-brand-yellow">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3">
                <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
                <a href={phoneHref} className={linkClass}>{CONTACT.phone.display}</a>
              </li>
              <li className="flex gap-3">
                <WhatsAppIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={linkClass}>WhatsApp</a>
              </li>
              <li className="flex gap-3">
                <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
                <a href={emailHref} className={`${linkClass} break-all`}>{CONTACT.email}</a>
              </li>
              <li className="flex gap-3">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
                <a href={directionsHref} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {OFFICE.line1}
                  <br />
                  {OFFICE.line2}
                </a>
              </li>
              <li className="flex gap-3">
                <GlobeIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
                <span>{CONTACT.website}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/15 pt-6 text-xs text-white/55 lg:flex-row lg:items-center lg:justify-between">
          <span>© {new Date().getFullYear()} {AGENT.name}. Todos los derechos reservados.</span>
          <p className="text-[11px] leading-snug lg:text-right">
            La información de esta web tiene carácter meramente informativo y no es contractual.
          </p>
        </div>
      </div>
    </footer>
  )
}
