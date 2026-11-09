import { ArrowRightIcon, MailIcon, MapPinIcon, PhoneIcon } from '@/components/brand/Icons'
import { LeafletMap } from '@/components/layout/LeafletMap'
import { AGENT, CONTACT, directionsHref, emailHref, mapLargeHref, OFFICE, phoneHref } from '@/lib/contact'

/**
 * Mapa de la oficina (Leaflet + OpenStreetMap): sin API key, cuenta ni facturación.
 * Muestra la ubicación de la agencia. El mapa de propiedades es PropertiesMap.
 */
export function OfficeMap({ className = '' }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-5">
        <div className="flex flex-col justify-center gap-5 bg-brand-green-deep p-8 text-white lg:col-span-2 lg:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-yellow">Visítanos</p>
            <h2 className="mt-2 text-3xl text-white">Nuestra oficina en Lugo</h2>
          </div>
          <ul className="space-y-3 text-sm text-white/85">
            <li className="flex gap-3">
              <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-yellow" />
              <span>
                {OFFICE.line1}
                <br />
                {OFFICE.line2}
              </span>
            </li>
            <li className="flex gap-3">
              <PhoneIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-yellow" />
              <a href={phoneHref} className="font-semibold text-white hover:text-brand-yellow">
                {CONTACT.phone.display}
              </a>
            </li>
            <li className="flex gap-3">
              <MailIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-yellow" />
              <a href={emailHref} className="break-all hover:text-brand-yellow">{CONTACT.email}</a>
            </li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="btn-accent gap-2">
              Cómo llegar <ArrowRightIcon className="h-4 w-4" />
            </a>
            <a href={mapLargeHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md border border-white/40 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10">
              Ver mapa grande
            </a>
          </div>
        </div>

        {/* isolate: mantiene los z-index internos de Leaflet por debajo de la cabecera fija */}
        <div className="relative isolate min-h-[320px] lg:col-span-3 lg:min-h-[420px]">
          <LeafletMap
            lat={OFFICE.lat}
            lon={OFFICE.lon}
            title={AGENT.name}
            address={OFFICE.full}
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </div>
    </div>
  )
}
