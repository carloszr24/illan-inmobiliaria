'use client'

import 'leaflet/dist/leaflet.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { LUGO_CENTER, OSM_ATTRIBUTION, OSM_TILES, pinSvg } from '@/components/layout/map-pin'

type Props = {
  lat: string
  lon: string
  /** Texto con el que buscar (ubicación + provincia del formulario). */
  query: string
  onChange: (lat: string, lon: string) => void
}

const fmt = (n: number) => n.toFixed(6)
const valid = (lat: string, lon: string) => lat.trim() !== '' && lon.trim() !== '' && Number.isFinite(parseFloat(lat)) && Number.isFinite(parseFloat(lon))

/**
 * Selector de ubicación del panel: clic en el mapa o arrastrar el marcador.
 * "Buscar" consulta Nominatim (el buscador público de OpenStreetMap, sin clave) y SOLO cuando
 * se pulsa el botón; nunca se envían datos mientras se escribe.
 */
export function LocationPicker({ lat, lon, query, onChange }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const markerRef = useRef<import('leaflet').Marker | null>(null)
  const libRef = useRef<typeof import('leaflet') | null>(null)
  const onChangeRef = useRef(onChange)
  const initial = useRef({ lat, lon })
  const [ready, setReady] = useState(false)
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Crea el mapa una sola vez
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !el.current) return
      libRef.current = L

      const start = valid(initial.current.lat, initial.current.lon)
        ? ([parseFloat(initial.current.lat), parseFloat(initial.current.lon)] as [number, number])
        : LUGO_CENTER
      const map = L.map(el.current, {
        center: start,
        zoom: valid(initial.current.lat, initial.current.lon) ? 16 : 13,
        scrollWheelZoom: false, // el panel es un formulario largo: no secuestrar el scroll
        doubleClickZoom: false, // un doble clic no debe mover el punto dos veces
      })
      L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map)
      map.on('click', (e: import('leaflet').LeafletMouseEvent) => {
        onChangeRef.current(fmt(e.latlng.lat), fmt(e.latlng.lng))
      })
      mapRef.current = map
      setReady(true)
    })()
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
      setReady(false)
    }
  }, [])

  // Mantiene el marcador sincronizado con los valores del formulario
  useEffect(() => {
    const L = libRef.current
    const map = mapRef.current
    if (!ready || !L || !map) return

    if (!valid(lat, lon)) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }
    const pos: [number, number] = [parseFloat(lat), parseFloat(lon)]
    if (markerRef.current) {
      markerRef.current.setLatLng(pos)
      return
    }
    const marker = L.marker(pos, {
      draggable: true,
      title: 'Arrastra para ajustar',
      icon: L.divIcon({ className: 'illan-pin', html: pinSvg('verde'), iconSize: [44, 56], iconAnchor: [22, 54] }),
    }).addTo(map)
    marker.on('dragend', () => {
      const p = marker.getLatLng()
      onChangeRef.current(fmt(p.lat), fmt(p.lng))
    })
    markerRef.current = marker
  }, [ready, lat, lon])

  const search = useCallback(async () => {
    const q = query.trim()
    if (!q) {
      setMessage('Escribe primero la ubicación del inmueble (por ejemplo, «Garabolos, Lugo»).')
      return
    }
    setSearching(true)
    setMessage(null)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=es&q=${encodeURIComponent(q)}`,
        { headers: { Accept: 'application/json' } }
      )
      const data = (await res.json()) as { lat: string; lon: string }[]
      if (!data[0]) {
        setMessage('No se encontró ese lugar. Haz clic en el mapa para colocar el punto a mano.')
        return
      }
      const la = parseFloat(data[0].lat)
      const lo = parseFloat(data[0].lon)
      onChangeRef.current(fmt(la), fmt(lo))
      mapRef.current?.setView([la, lo], 16)
    } catch {
      setMessage('No se pudo buscar ahora. Haz clic en el mapa para colocar el punto a mano.')
    } finally {
      setSearching(false)
    }
  }, [query])

  const placed = valid(lat, lon)

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={search} disabled={searching} className="btn-outline px-4 py-2 text-xs disabled:opacity-60">
          {searching ? 'Buscando…' : query.trim() ? `Buscar «${query.trim().slice(0, 28)}${query.trim().length > 28 ? '…' : ''}»` : 'Buscar la ubicación'}
        </button>
        {placed && (
          <button type="button" onClick={() => onChange('', '')} className="text-xs font-medium text-red-600 hover:text-red-800">
            Quitar ubicación
          </button>
        )}
        <span className="text-xs text-stone-500">
          {placed ? `Punto: ${parseFloat(lat).toFixed(5)}, ${parseFloat(lon).toFixed(5)}` : 'Sin ubicación: no saldrá en el mapa público.'}
        </span>
      </div>
      {message && <p role="status" className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{message}</p>}
      <div className="relative isolate overflow-hidden rounded-lg border border-stone-300">
        <div ref={el} role="application" aria-label="Mapa para colocar la ubicación del inmueble" className="h-[320px] w-full" />
      </div>
      <p className="mt-2 text-xs text-stone-500">
        Haz clic en el mapa o arrastra el marcador. Si el propietario prefiere discreción, coloca el punto de forma aproximada (la zona o la calle).
      </p>
    </div>
  )
}
