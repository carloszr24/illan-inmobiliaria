import type { Metadata } from 'next'
import { Suspense } from 'react'
import { GlobeIcon, MailIcon, MapPinIcon, PhoneIcon, WhatsAppIcon } from '@/components/brand/Icons'
import { ContactForm } from '@/components/contact/ContactForm'
import { OfficeMap } from '@/components/layout/OfficeMap'
import { PageHero } from '@/components/layout/PageHero'
import { CONTACT, directionsHref, emailHref, OFFICE, phoneHref, whatsappDisplay, whatsappHref } from '@/lib/contact'

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Contacta con ILLAN Inmobiliaria en Lugo: teléfono, WhatsApp, email y dirección de la oficina.',
}

const rows = [
  { icon: PhoneIcon, label: 'Teléfono', text: CONTACT.phone.display, href: phoneHref },
  { icon: WhatsAppIcon, label: 'WhatsApp', text: whatsappDisplay, href: whatsappHref, external: true },
  { icon: MailIcon, label: 'Email', text: CONTACT.email, href: emailHref },
  { icon: MapPinIcon, label: 'Oficina', text: `${OFFICE.line1}, ${OFFICE.line2}`, href: directionsHref, external: true },
  { icon: GlobeIcon, label: 'Web', text: CONTACT.website },
]

export default function ContactoPage() {
  return (
    <>
      <PageHero
        eyebrow="Contacto"
        title="Estamos aquí para ayudarte"
        subtitle="Escríbenos, llámanos o pásate por la oficina. Te atenderemos encantados."
      />

      <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Suspense fallback={<div className="skeleton h-[28rem] w-full rounded-2xl" />}>
              <ContactForm />
            </Suspense>
          </div>

          <aside className="lg:col-span-2">
            <h2 className="mb-6 text-2xl text-stone-900">Información de contacto</h2>
            <ul className="space-y-5">
              {rows.map(({ icon: Icon, label, text, href, external }) => (
                <li key={label} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-green text-brand-yellow">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-400">{label}</p>
                    {href ? (
                      <a
                        href={href}
                        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="break-all text-stone-800 transition-colors hover:text-brand-green"
                      >
                        {text}
                      </a>
                    ) : (
                      <p className="text-stone-800">{text}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <OfficeMap className="mt-16" />
      </div>
    </>
  )
}
