import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { MapPinIcon } from '@/components/brand/Icons'
import { PageHero } from '@/components/layout/PageHero'
import { PropertiesMap, type MapMarker } from '@/components/properties/PropertiesMap'
import { PropertyCard } from '@/components/properties/PropertyCard'
import { PropertyFilters } from '@/components/properties/PropertyFilters'
import { filterProperties, listPublicProperties, type PublicSearchParams } from '@/lib/properties'
import { cn, formatPrice, parseImages } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Propiedades en Lugo',
  description: 'Pisos, casas, locales y terrenos en venta y alquiler en Lugo y provincia, en lista y en mapa.',
}

const FILTER_KEYS = ['type', 'operation', 'status', 'minPrice', 'maxPrice', 'bedrooms', 'extras', 'q'] as const

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await searchParams
  const params: PublicSearchParams = {}
  for (const key of FILTER_KEYS) {
    const value = raw[key]
    if (typeof value === 'string') params[key] = value
  }
  const view: 'lista' | 'mapa' = raw.vista === 'mapa' ? 'mapa' : 'lista'

  const all = await listPublicProperties()
  const properties = filterProperties(all, params)

  const hrefFor = (target: 'lista' | 'mapa') => {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v)
    if (target === 'mapa') sp.set('vista', 'mapa')
    const qs = sp.toString()
    return qs ? `/propiedades?${qs}` : '/propiedades'
  }

  const markers: MapMarker[] = properties
    .filter((p) => p.lat != null && p.lon != null)
    .map((p) => ({
      id: p.id,
      lat: p.lat as number,
      lon: p.lon as number,
      title: p.title,
      location: p.location,
      price: formatPrice(p.price, p.operation),
      operation: p.operation === 'alquiler' ? 'alquiler' : 'venta',
      image: parseImages(p.images)[0],
    }))
  const withoutLocation = properties.length - markers.length

  return (
    <>
      <PageHero
        eyebrow="Catálogo"
        title="Propiedades en Lugo y provincia"
        subtitle={`${properties.length} inmueble${properties.length !== 1 ? 's' : ''} ${properties.length !== 1 ? 'disponibles' : 'disponible'}`}
      />

      <Suspense fallback={<div className="h-28 border-b border-stone-200 bg-brand-green-tint/60" />}>
        <PropertyFilters />
      </Suspense>

      <div className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
        {/* Selector Lista / Mapa */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <p className="text-sm text-stone-500">
            {view === 'mapa' ? 'Pulsa un marcador para ver el inmueble.' : 'Ordenados como los muestra la agencia.'}
          </p>
          <div role="group" aria-label="Tipo de vista" className="inline-flex overflow-hidden rounded-md border border-brand-green/30 bg-white">
            {(['lista', 'mapa'] as const).map((v) => (
              <Link
                key={v}
                href={hrefFor(v)}
                scroll={false}
                aria-current={view === v ? 'true' : undefined}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors',
                  view === v ? 'bg-brand-green text-white' : 'text-stone-600 hover:bg-brand-green-tint'
                )}
              >
                {v === 'mapa' && <MapPinIcon className="h-4 w-4" />}
                {v === 'lista' ? 'Lista' : 'Mapa'}
              </Link>
            ))}
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 py-24 text-center">
            <p className="mb-2 text-lg text-stone-600">No hay inmuebles con esos filtros</p>
            <p className="mb-6 text-sm text-stone-500">Prueba a cambiar la búsqueda o consulta todo el catálogo.</p>
            <Link href="/propiedades" className="btn-primary">
              Ver todas las propiedades
            </Link>
          </div>
        ) : view === 'mapa' ? (
          <div>
            <div className="relative isolate overflow-hidden rounded-2xl border border-stone-200 shadow-sm">
              <PropertiesMap
                markers={markers}
                label="Mapa de propiedades"
                className="h-[480px] w-full md:h-[620px]"
              />
              <ul className="pointer-events-none absolute bottom-3 left-3 z-[500] flex gap-2 text-xs font-medium" aria-label="Leyenda">
                <li className="rounded-full bg-white/95 px-3 py-1 text-stone-700 shadow"><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-brand-green align-middle" />Venta</li>
                <li className="rounded-full bg-white/95 px-3 py-1 text-stone-700 shadow"><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-brand-yellow align-middle ring-1 ring-brand-green-deep/40" />Alquiler</li>
              </ul>
            </div>
            {withoutLocation > 0 && (
              <p className="mt-4 text-sm text-stone-500">
                {withoutLocation} inmueble{withoutLocation !== 1 ? 's' : ''} sin ubicación en el mapa.{' '}
                <Link href={hrefFor('lista')} className="font-medium text-brand-green underline">Ver en lista</Link>
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
            {properties.map((property, i) => (
              <PropertyCard key={property.id} property={property} priority={i < 3} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
