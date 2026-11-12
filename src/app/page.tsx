import Image from 'next/image'
import Link from 'next/link'
import { ArrowRightIcon, ChartIcon, FileIcon, HandshakeIcon, HomeIcon, KeyIcon, MapPinIcon, PhoneIcon, ShieldIcon, WhatsAppIcon } from '@/components/brand/Icons'
import { HeroSkyline } from '@/components/home/HeroSkyline'
import { ValoracionGratuitaModal } from '@/components/home/ValoracionGratuitaModal'
import { OfficeMap } from '@/components/layout/OfficeMap'
import { PropertyCard } from '@/components/properties/PropertyCard'
import { HERO_PHOTO } from '@/data/credits'
import { PROCESS_STEPS, SERVICE_ITEMS, type ServiceKey } from '@/data/services'
import { CONTACT, phoneHref, whatsappHref } from '@/lib/contact'
import { listFeaturedForHome } from '@/lib/properties'
import { PROPERTY_OPERATIONS, PROPERTY_TYPES, TYPE_LABELS } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const SERVICE_ICONS: Record<ServiceKey, (p: React.SVGProps<SVGSVGElement>) => React.JSX.Element> = {
  compraventa: HomeIcon,
  alquiler: KeyIcon,
  valoracion: ChartIcon,
  documentacion: FileIcon,
  seguros: ShieldIcon,
  asesoramiento: HandshakeIcon,
}

export default async function HomePage() {
  const featured = await listFeaturedForHome()

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-brand-green-deep via-brand-green-dark to-brand-green">
        {/* Foto del centro de Lugo, difuminada y teñida con el verde de la marca (ver crédito en el pie) */}
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <Image
            src={HERO_PHOTO.src}
            alt=""
            fill
            priority
            quality={70}
            sizes="100vw"
            className="scale-105 object-cover object-[50%_40%] opacity-45 mix-blend-luminosity blur-[2px]"
          />
          {/* Velo verde: más intenso a la izquierda, donde va el texto */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-green-deep/85 via-brand-green-deep/50 to-brand-green-dark/20" />
        </div>
        <div className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-brand-yellow/20 blur-3xl" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-12 pt-14 md:px-10 md:pb-16 md:pt-20 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-yellow/50 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-yellow">
              Inmobiliaria en Lugo
            </p>
            <h1 className="text-balance text-4xl leading-[1.08] text-white md:text-6xl">
              Encuentra tu próximo hogar <span className="text-brand-yellow">en Lugo</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85">
              Compra, venta y alquiler de pisos, casas, locales y terrenos, y oportunidades de inversión en Lugo y provincia. Trato directo y
              acompañamiento en cada paso.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/propiedades" className="btn-accent gap-2 px-8 py-4 text-base">
                Ver propiedades <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <ValoracionGratuitaModal
                triggerLabel="Quiero vender mi inmueble"
                triggerClassName="inline-flex items-center justify-center rounded-md border-2 border-white/80 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-white hover:text-brand-green-dark"
              />
            </div>
          </div>

          {/* Buscador rápido (formulario GET, sin JavaScript) */}
          <form action="/propiedades" method="get" className="rounded-2xl bg-white p-6 shadow-2xl lg:col-span-5">
            <h2 className="text-xl text-brand-green-dark">Busca tu inmueble</h2>
            <p className="mt-1 text-sm text-stone-500">Filtra por operación, tipo o zona.</p>
            <fieldset className="mt-5">
              <legend className="sr-only">Operación</legend>
              <div className="grid grid-cols-2 gap-2">
                {PROPERTY_OPERATIONS.map((op, i) => (
                  <label key={op} className="cursor-pointer">
                    <input type="radio" name="operation" value={op} defaultChecked={i === 0} className="peer sr-only" />
                    <span className="block rounded-md border border-stone-300 py-2.5 text-center text-sm font-medium text-stone-600 transition-colors peer-checked:border-brand-green peer-checked:bg-brand-green peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-green/40">
                      {op === 'venta' ? 'Comprar' : 'Alquilar'}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="mt-4 space-y-4">
              <div>
                <label className="field-label" htmlFor="h-type">Tipo de inmueble</label>
                <select id="h-type" name="type" className="field" defaultValue="">
                  <option value="">Todos</option>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="h-q">Zona o referencia</label>
                <input id="h-q" name="q" className="field" placeholder="Ej: Centro, Garabolos, ILL-0001" />
              </div>
            </div>
            <button type="submit" className="btn-primary mt-5 w-full py-3.5 text-base">
              Buscar
            </button>
          </form>
        </div>

        {/* Silueta de la ciudad: va en el flujo de la página, así nunca se solapa con el texto */}
        <HeroSkyline className="pointer-events-none block h-[150px] w-full md:h-[230px]" />
      </section>

      {/* SERVICIOS */}
      <section className="bg-white px-6 py-20 md:px-10 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="eyebrow">Qué hacemos</p>
            <h2 className="mt-3 text-3xl text-stone-900 md:text-4xl">Todo lo que necesitas para comprar, vender o alquilar</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {SERVICE_ITEMS.slice(0, 3).map((service) => {
              const Icon = SERVICE_ICONS[service.key]
              return (
                <div key={service.key} className="rounded-xl border border-stone-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand-green hover:shadow-lg">
                  <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand-green text-brand-yellow">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mb-2 text-xl text-stone-900">{service.title}</h3>
                  <p className="text-sm leading-relaxed text-stone-600">{service.desc}</p>
                </div>
              )
            })}
          </div>
          <div className="mt-10 text-center">
            <Link href="/servicios" className="btn-outline gap-2">
              Ver todos los servicios <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* DESTACADOS */}
      <section className="bg-brand-green-tint/60 px-6 py-20 md:px-10 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Selección</p>
              <h2 className="mt-3 text-3xl text-stone-900 md:text-4xl">
                Inmuebles <span className="text-brand-green">destacados</span>
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/propiedades?vista=mapa" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-green underline-offset-4 hover:underline">
                <MapPinIcon className="h-4 w-4" /> Ver en el mapa
              </Link>
              <Link href="/propiedades" className="btn-outline gap-2 text-xs">
                Ver todas <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
          {featured.length > 0 ? (
            <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((property, i) => (
                <PropertyCard key={property.id} property={property} priority={i === 0} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-stone-300 py-16 text-center text-stone-500">
              Pronto añadiremos inmuebles destacados.
            </p>
          )}
        </div>
      </section>

      {/* CÓMO TRABAJAMOS */}
      <section className="bg-white px-6 py-20 md:px-10 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="eyebrow">Cómo trabajamos</p>
            <h2 className="mt-3 text-3xl text-stone-900 md:text-4xl">Un proceso sencillo y a tu lado</h2>
          </div>
          <ol className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {PROCESS_STEPS.map((step, i) => (
              <li key={step.title} className="relative rounded-xl bg-brand-green-tint/70 p-8 pt-12">
                <span className="absolute -top-5 left-8 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-brand-yellow font-display text-xl font-bold text-brand-green-deep shadow">
                  {i + 1}
                </span>
                <h3 className="mb-2 text-xl text-stone-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-stone-600">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* LLAMADA A LA ACCIÓN */}
      <section className="bg-gradient-to-r from-brand-green-deep via-brand-green-dark to-brand-green px-6 py-20 md:px-10 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl text-white md:text-5xl">¿Hablamos de tu próxima operación?</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/85">
            Cuéntanos qué necesitas. Te respondemos por teléfono o WhatsApp y empezamos a trabajar.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href={phoneHref} className="btn-accent gap-2 px-9 py-4 text-base">
              <PhoneIcon className="h-5 w-5" /> Llamar al {CONTACT.phone.display}
            </a>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md border-2 border-white/80 px-9 py-4 text-base font-medium text-white transition-colors hover:bg-white hover:text-brand-green-dark">
              <WhatsAppIcon className="h-5 w-5" /> Escribir por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* MAPA */}
      <section className="bg-white px-6 py-20 md:px-10 md:py-24">
        <div className="mx-auto max-w-7xl">
          <OfficeMap />
        </div>
      </section>
    </>
  )
}
