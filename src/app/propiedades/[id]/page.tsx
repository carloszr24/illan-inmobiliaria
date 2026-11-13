import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AreaIcon, BathIcon, BedIcon, MapPinIcon, PhoneIcon, WhatsAppIcon } from '@/components/brand/Icons'
import { PropertiesMap } from '@/components/properties/PropertiesMap'
import { PropertyGallery } from '@/components/properties/PropertyGallery'
import { CONTACT, phoneHref, whatsappHref } from '@/lib/contact'
import { getPublicPropertyById } from '@/lib/properties'
import { getExtraLabel, getPropertyExtras } from '@/lib/property-extras'
import {
  cn,
  formatPrice,
  hasPrice,
  OPERATION_LABELS,
  parseImages,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  TYPE_LABELS,
} from '@/lib/utils'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const property = await getPublicPropertyById((await params).id)
  if (!property) return { title: 'Propiedad no encontrada' }
  return {
    title: property.title,
    description: property.description.replace(/\s+/g, ' ').slice(0, 155),
  }
}

const ENERGY_COLORS: Record<string, string> = {
  A: 'bg-green-600',
  B: 'bg-green-500',
  C: 'bg-lime-500',
  D: 'bg-yellow-400 !text-stone-900',
  E: 'bg-amber-500',
  F: 'bg-orange-600',
  G: 'bg-red-600',
}

function EnergyBadge({ label, rating, value }: { label: string; rating?: string | null; value?: number | null }) {
  if (!rating) return null
  return (
    <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-3">
      <span className={cn('flex h-10 w-10 items-center justify-center rounded-md text-lg font-bold text-white', ENERGY_COLORS[rating] || 'bg-stone-500')}>
        {rating}
      </span>
      <div>
        <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
        {value != null && <p className="text-sm text-stone-700">{value} kg CO₂/m² año</p>}
      </div>
    </div>
  )
}

export default async function PropertyPage({ params }: Ctx) {
  const property = await getPublicPropertyById((await params).id)
  if (!property) notFound()

  const images = parseImages(property.images)
  const operation = property.operation || 'venta'
  const extras = getPropertyExtras(property)
  const waText = encodeURIComponent(
    `Hola, me interesa el inmueble "${property.title}"${property.ref ? ` (ref. ${property.ref})` : ''}. ¿Podéis darme más información?`
  )

  const details = [
    ['Tipo', TYPE_LABELS[property.type] || property.type],
    ['Operación', OPERATION_LABELS[operation] || operation],
    ['Planta', property.floor],
    ['Estado', property.condition],
    ['Antigüedad', property.propertyAge],
    ['Disponibilidad', property.availability],
    ['Agua caliente', property.hotWater],
    ['Calefacción', property.heating && !['sí', 'si'].includes(property.heating.toLowerCase()) ? property.heating : null],
  ].filter(([, v]) => v) as [string, string][]

  return (
    <div className="bg-white">
      <div className="border-b border-stone-200 bg-brand-green-tint/60">
        <nav aria-label="Migas de pan" className="mx-auto max-w-7xl px-6 py-3.5 text-sm text-stone-500 md:px-10">
          <Link href="/" className="hover:text-brand-green">Inicio</Link>
          <span className="mx-2">/</span>
          <Link href="/propiedades" className="hover:text-brand-green">Propiedades</Link>
          <span className="mx-2">/</span>
          <span className="text-stone-800">{property.title}</span>
        </nav>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-10 md:px-10 lg:grid-cols-3 lg:gap-12">
        <div className="lg:col-span-2">
          <PropertyGallery images={images} title={property.title} />

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-green">
              {TYPE_LABELS[property.type] || property.type} en {OPERATION_LABELS[operation]?.toLowerCase()}
            </p>
            <h1 className="mt-2 text-3xl text-stone-900 md:text-4xl">{property.title}</h1>
            <p className="mt-2 inline-flex items-center gap-2 text-stone-600">
              <MapPinIcon className="h-5 w-5 text-brand-green" /> {property.location}
            </p>
          </div>

          {(property.sqMeters || property.bedrooms || property.bathrooms) && (
            <ul className="mt-6 grid grid-cols-3 gap-3">
              {property.sqMeters ? (
                <li className="rounded-xl bg-brand-green-tint p-4 text-center">
                  <AreaIcon className="mx-auto h-6 w-6 text-brand-green" />
                  <p className="mt-1 font-display text-xl font-semibold text-brand-green-dark">{property.sqMeters} m²</p>
                  <p className="text-xs text-stone-500">Superficie</p>
                </li>
              ) : null}
              {property.bedrooms ? (
                <li className="rounded-xl bg-brand-green-tint p-4 text-center">
                  <BedIcon className="mx-auto h-6 w-6 text-brand-green" />
                  <p className="mt-1 font-display text-xl font-semibold text-brand-green-dark">{property.bedrooms}</p>
                  <p className="text-xs text-stone-500">Habitaciones</p>
                </li>
              ) : null}
              {property.bathrooms ? (
                <li className="rounded-xl bg-brand-green-tint p-4 text-center">
                  <BathIcon className="mx-auto h-6 w-6 text-brand-green" />
                  <p className="mt-1 font-display text-xl font-semibold text-brand-green-dark">{property.bathrooms}</p>
                  <p className="text-xs text-stone-500">Baños</p>
                </li>
              ) : null}
            </ul>
          )}

          <section className="mt-10">
            <h2 className="mb-3 text-2xl text-stone-900">Descripción</h2>
            <div className="whitespace-pre-line leading-relaxed text-stone-700">{property.description}</div>
          </section>

          {(details.length > 0 || extras.length > 0) && (
            <section className="mt-10">
              <h2 className="mb-4 text-2xl text-stone-900">Características</h2>
              {details.length > 0 && (
                <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                  {details.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-stone-100 py-2.5 text-sm">
                      <dt className="text-stone-500">{k}</dt>
                      <dd className="text-right font-medium text-stone-800">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {extras.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {extras.map((extra) => (
                    <li key={extra} className="rounded-full border border-brand-green/30 bg-brand-green-tint px-3.5 py-1.5 text-sm font-medium text-brand-green-dark">
                      ✓ {getExtraLabel(extra)}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {(property.energyRating || property.emissionsRating) && (
            <section className="mt-10">
              <h2 className="mb-4 text-2xl text-stone-900">Certificación energética</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <EnergyBadge label="Consumo de energía" rating={property.energyRating} value={property.energyValue} />
                <EnergyBadge label="Emisiones" rating={property.emissionsRating} value={property.emissionsValue} />
              </div>
            </section>
          )}

          {property.lat != null && property.lon != null && (
            <section className="mt-10">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-2xl text-stone-900">Ubicación</h2>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${property.lat}&mlon=${property.lon}#map=17/${property.lat}/${property.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-brand-green underline-offset-4 hover:underline"
                >
                  Ver en un mapa más grande ↗
                </a>
              </div>
              <div className="relative isolate overflow-hidden rounded-xl border border-stone-200">
                <PropertiesMap
                  single
                  label={`Mapa con la ubicación de ${property.title}`}
                  className="h-[320px] w-full md:h-[380px]"
                  markers={[
                    {
                      id: property.id,
                      lat: property.lat,
                      lon: property.lon,
                      title: property.title,
                      location: property.location,
                      price: formatPrice(property.price, operation),
                      operation: operation === 'alquiler' ? 'alquiler' : 'venta',
                    },
                  ]}
                />
              </div>
              <p className="mt-2 text-xs text-stone-400">Ubicación orientativa. Consulta con la agencia la dirección exacta y concierta tu visita.</p>
            </section>
          )}
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-28 space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                {hasPrice(property.price) ? (
                  <p className="font-display text-4xl font-semibold text-brand-green-dark">{formatPrice(property.price, operation)}</p>
                ) : (
                  <p className="font-display text-2xl font-semibold leading-tight text-brand-green-dark">Precio a consultar</p>
                )}
                <span className={cn('rounded border px-2.5 py-1 text-xs font-medium', STATUS_BADGE_CLASSES[property.status] || STATUS_BADGE_CLASSES.disponible)}>
                  {STATUS_LABELS[property.status] || property.status}
                </span>
              </div>
              {property.ref && <p className="mt-1 text-sm text-stone-500">Referencia {property.ref}</p>}

              <div className="mt-6 space-y-3">
                <Link href={`/contacto?ref=${encodeURIComponent(property.ref || property.id)}`} className="btn-primary w-full py-3.5 text-base">
                  Solicitar información
                </Link>
                <a href={phoneHref} className="btn-accent w-full gap-2 py-3.5 text-base">
                  <PhoneIcon className="h-5 w-5" /> {CONTACT.phone.display}
                </a>
                <a href={`${whatsappHref}?text=${waText}`} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-brand-green py-3.5 text-base font-medium text-brand-green transition-colors hover:bg-brand-green hover:text-white">
                  <WhatsAppIcon className="h-5 w-5" /> WhatsApp
                </a>
              </div>
              {property.portalUrl && (
                <a href={property.portalUrl} target="_blank" rel="noopener noreferrer" className="mt-4 block text-center text-sm text-stone-500 underline-offset-4 hover:text-brand-green hover:underline">
                  Ver anuncio en portal externo ↗
                </a>
              )}
            </div>
            <p className="px-2 text-xs leading-relaxed text-stone-400">
              La información de este inmueble es orientativa y no tiene carácter contractual. Consulta disponibilidad y condiciones con la agencia.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
