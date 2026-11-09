'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { escapeHtml, OSM_ATTRIBUTION, OSM_TILES, pinSvg } from '@/components/layout/map-pin'

type Props = {
  lat: number
  lon: number
  title: string
  address: string
  zoom?: number
  className?: string
}

/**
 * Mapa de la oficina con Leaflet + teselas de OpenStreetMap.
 * No requiere API key, cuenta ni facturación (a diferencia de Google Maps).
 */
export function LeafletMap({ lat, lon, title, address, zoom = 16, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let map: import('leaflet').Map | undefined
    let cancelled = false

    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !ref.current) return

      map = L.map(ref.current, {
        center: [lat, lon],
        zoom,
        scrollWheelZoom: false, // evita "secuestrar" el scroll de la página
        dragging: !L.Browser.mobile, // en móvil, un dedo sigue desplazando la página
      })

      L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map)

      const icon = L.divIcon({
        className: 'illan-pin',
        html: pinSvg('verde'),
        iconSize: [44, 56],
        iconAnchor: [22, 54],
        popupAnchor: [0, -50],
      })

      L.marker([lat, lon], { icon, title, alt: title })
        .addTo(map)
        .bindPopup(`<strong>${escapeHtml(title)}</strong><br>${escapeHtml(address)}`)
        .openPopup()

      // Con la rueda solo se hace zoom tras hacer clic en el mapa
      map.on('click', () => map?.scrollWheelZoom.enable())
      map.on('mouseout', () => map?.scrollWheelZoom.disable())
    })()

    return () => {
      cancelled = true
      map?.remove()
    }
  }, [lat, lon, zoom, title, address])

  return <div ref={ref} role="region" aria-label={`Mapa con la ubicación de ${title}`} className={className} />
}
