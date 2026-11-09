import type { Metadata } from 'next'
import Link from 'next/link'
import { ChartIcon, FileIcon, HandshakeIcon, HomeIcon, KeyIcon, PhoneIcon, ShieldIcon } from '@/components/brand/Icons'
import { ValoracionGratuitaModal } from '@/components/home/ValoracionGratuitaModal'
import { PageHero } from '@/components/layout/PageHero'
import { PROCESS_STEPS, SERVICE_ITEMS, type ServiceKey } from '@/data/services'
import { AGENT, CONTACT, phoneHref } from '@/lib/contact'

export const metadata: Metadata = {
  title: 'Servicios inmobiliarios en Lugo',
  description: 'Compraventa, alquiler, valoración gratuita, documentación y seguros. ILLAN Inmobiliaria, tu agencia en Lugo.',
}

const ICONS: Record<ServiceKey, (p: React.SVGProps<SVGSVGElement>) => React.JSX.Element> = {
  compraventa: HomeIcon,
  alquiler: KeyIcon,
  valoracion: ChartIcon,
  documentacion: FileIcon,
  seguros: ShieldIcon,
  asesoramiento: HandshakeIcon,
}

export default function ServiciosPage() {
  return (
    <>
      <PageHero
        eyebrow="Servicios"
        title="Un servicio completo, con trato directo"
        subtitle="Desde la primera visita hasta la firma, nos ocupamos de que tu operación sea sencilla."
      />

      <section className="px-6 py-20 md:px-10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SERVICE_ITEMS.map((service) => {
            const Icon = ICONS[service.key]
            return (
              <article key={service.key} className="rounded-xl border border-stone-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand-green hover:shadow-lg">
                <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand-green text-brand-yellow">
                  <Icon className="h-6 w-6" />
                </span>
                <h2 className="mb-2 text-xl text-stone-900">{service.title}</h2>
                <p className="text-sm leading-relaxed text-stone-600">{service.desc}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="bg-brand-green-tint/60 px-6 py-20 md:px-10">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Quiénes somos</p>
            <h2 className="mt-3 text-3xl text-stone-900 md:text-4xl">{AGENT.name}, tu agencia en Lugo</h2>
            <p className="mt-5 leading-relaxed text-stone-700">
              Somos una agencia inmobiliaria de Lugo con oficina abierta al público. Al frente de ILLAN está Ángel
              González Illán, tu persona de contacto para cualquier operación en la ciudad y su provincia.
            </p>
            <p className="mt-4 leading-relaxed text-stone-700">
              Si quieres comprar, vender o alquilar, pásate por la oficina, llámanos o escríbenos por WhatsApp.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href={phoneHref} className="btn-primary gap-2">
                <PhoneIcon className="h-4 w-4" /> {CONTACT.phone.display}
              </a>
              <Link href="/contacto" className="btn-outline">Ir a contacto</Link>
            </div>
          </div>

          <ol className="space-y-5">
            {PROCESS_STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-5 rounded-xl bg-white p-6 shadow-sm">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-yellow font-display text-lg font-bold text-brand-green-deep">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg text-stone-900">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-stone-600">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-gradient-to-r from-brand-green-deep via-brand-green-dark to-brand-green px-6 py-16 md:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <div>
            <h2 className="text-3xl text-white">¿Quieres saber cuánto vale tu inmueble?</h2>
            <p className="mt-2 text-white/85">Pide tu valoración gratuita y sin compromiso.</p>
          </div>
          <ValoracionGratuitaModal triggerLabel="Valoración gratuita" triggerClassName="btn-accent shrink-0 px-9 py-4 text-base" />
        </div>
      </section>
    </>
  )
}
