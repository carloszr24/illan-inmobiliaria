import Image from 'next/image'
import Link from 'next/link'
import { AreaIcon, BathIcon, BedIcon } from '@/components/brand/Icons'
import type { Property } from '@/types'
import {
  cn,
  formatPrice,
  OPERATION_LABELS,
  parseImages,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  TYPE_LABELS,
} from '@/lib/utils'

export function PropertyCard({ property, priority = false }: { property: Property; priority?: boolean }) {
  const images = parseImages(property.images)
  const first = images[0]
  const operation = property.operation || 'venta'

  return (
    <Link href={`/propiedades/${property.id}`} className="group block h-full">
      <article className="card-hover flex h-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="relative aspect-[4/3] overflow-hidden bg-brand-green-tint">
          {first ? (
            <Image
              src={first}
              alt={property.title}
              fill
              unoptimized
              priority={priority}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.18em] text-stone-400">
              Sin foto disponible
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

          <span className="absolute left-3 top-3 rounded bg-brand-yellow px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-green-deep shadow">
            {OPERATION_LABELS[operation] || operation}
          </span>
          <span
            className={cn(
              'absolute bottom-3 left-3 rounded border px-2.5 py-1 text-xs font-medium',
              STATUS_BADGE_CLASSES[property.status] || STATUS_BADGE_CLASSES.disponible
            )}
          >
            {STATUS_LABELS[property.status] || property.status}
          </span>
          {images.length > 1 && (
            <span className="absolute bottom-3 right-3 rounded bg-black/55 px-2 py-1 text-xs text-white">
              {images.length} fotos
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-brand-green">
            {TYPE_LABELS[property.type] || property.type}
            {property.ref ? <span className="text-stone-400"> · {property.ref}</span> : null}
          </p>
          <h3 className="line-clamp-2 text-lg leading-snug text-stone-900 transition-colors group-hover:text-brand-green">
            {property.title}
          </h3>
          <p className="mt-1 text-sm text-stone-500">{property.location}</p>

          {(property.sqMeters || property.bedrooms || property.bathrooms) && (
            <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-stone-100 pt-4 text-sm text-stone-600">
              {property.sqMeters ? (
                <li className="inline-flex items-center gap-1.5">
                  <AreaIcon className="h-4 w-4 text-brand-green" /> {property.sqMeters} m²
                </li>
              ) : null}
              {property.bedrooms ? (
                <li className="inline-flex items-center gap-1.5">
                  <BedIcon className="h-4 w-4 text-brand-green" /> {property.bedrooms} hab.
                </li>
              ) : null}
              {property.bathrooms ? (
                <li className="inline-flex items-center gap-1.5">
                  <BathIcon className="h-4 w-4 text-brand-green" /> {property.bathrooms} baños
                </li>
              ) : null}
            </ul>
          )}

          <div className="mt-auto flex items-end justify-between pt-5">
            <span className="font-display text-2xl font-semibold text-brand-green-dark">
              {formatPrice(property.price, operation)}
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-green transition-transform group-hover:translate-x-1">
              Ver →
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
