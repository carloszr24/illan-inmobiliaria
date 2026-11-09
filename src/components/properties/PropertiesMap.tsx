'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { escapeHtml, LUGO_CENTER, OSM_ATTRIBUTION, OSM_TILES, pinSvg } from '@/components/layout/map-pin'

export type MapMarker = {
  id: string
  lat: number
  lon: number
  title: string
  location: string
  /** Precio ya formateado ("165.000 €"). */
  price: string
  operation: 'venta' | 'alquiler'
  /** Primera foto, si existe. */
  image?: string
}

type Props = {
  markers: MapMarker[]
  /** true en la ficha de un inmueble: un solo punto, sin ventana emergente. */
  single?: boolean
  className?: string
  label: string
}

/**
 * Mapa de propiedades (Leaflet + OpenStreetMap, sin claves).
 * Muestra un marcador por inmueble con ventana emergente (foto, precio y enlace a la ficha).
 */
export function PropertiesMap({ markers, single = false, className, label }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  // Clave estable: el mapa solo se reconstruye si cambian de verdad los puntos
  const markersKey = JSON.stringify(markers)

  useEffect(() => {
    const markers = JSON.parse(markersKey) as MapMarker[]
    let map: import('leaflet').Map | undefined
    let cancelled = false

    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !ref.current) return

      map = L.map(ref.current, {
        center: markers[0] ? [markers[0].lat, markers[0].lon] : LUGO_CENTER,
        zoom: 13,
        scrollWheelZoom: false,
        dragging: !L.Browser.mobile,
      })
      L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map)

      const pins = {
        venta: L.divIcon({ className: 'illan-pin', html: pinSvg('verde'), iconSize: [44, 56], iconAnchor: [22, 54], popupAnchor: [0, -50] }),
        alquiler: L.divIcon({ className: 'illan-pin', html: pinSvg('amarillo'), iconSize: [44, 56], iconAnchor: [22, 54], popupAnchor: [0, -50] }),
      }

      for (const m of markers) {
        const marker = L.marker([m.lat, m.lon], { icon: pins[m.operation], title: m.title, alt: m.title }).addTo(map)
        if (!single) {
          const tag = m.operation === 'alquiler' ? 'Alquiler' : 'Venta'
          marker.bindPopup(
            `<a class="illan-popup-link" href="/propiedades/${encodeURIComponent(m.id)}">` +
              (m.image ? `<img src="${escapeHtml(m.image)}" alt="" loading="lazy" />` : '') +
              `<span class="illan-popup-body"><span class="illan-popup-tag">${tag}</span>` +
              `<strong>${escapeHtml(m.title)}</strong>` +
              `<span class="illan-popup-loc">${escapeHtml(m.location)}</span>` +
              `<span class="illan-popup-price">${escapeHtml(m.price)}</span></span></a>`,
            { className: 'illan-popup', maxWidth: 260, minWidth: 240 }
          )
        }
      }

      if (markers.length === 1) {
        map.setView([markers[0].lat, markers[0].lon], 15)
      } else if (markers.length > 1) {
        map.fitBounds(L.latLngBounds(markers.map((m) => [m.lat, m.lon] as [number, number])), {
          padding: [60, 60],
          maxZoom: 15,
        })
      }

      map.on('click', () => map?.scrollWheelZoom.enable())
      map.on('mouseout', () => map?.scrollWheelZoom.disable())
    })()

    return () => {
      cancelled = true
      map?.remove()
    }
  }, [markersKey, single])

  return <div ref={ref} role="region" aria-label={label} className={className} />
}
