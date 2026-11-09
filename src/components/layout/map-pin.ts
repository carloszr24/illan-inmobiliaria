/**
 * Marcadores de mapa con los colores de la marca (SVG inline: sin imágenes externas).
 * - "verde": venta y oficina · "amarillo": alquiler
 */
export type PinTone = 'verde' | 'amarillo'

export function pinSvg(tone: PinTone = 'verde'): string {
  const body = tone === 'verde' ? '#1B8036' : '#E8DC2D'
  const dot = tone === 'verde' ? '#E8DC2D' : '#1B8036'
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 56" width="44" height="56" aria-hidden="true">
<path d="M22 54C22 54 4 33 4 21a18 18 0 0 1 36 0c0 12-18 33-18 33Z" fill="${body}" stroke="#0D4720" stroke-width="2.5"/>
<circle cx="22" cy="21" r="9.5" fill="${dot}" stroke="#fff" stroke-width="2.5"/>
<path d="M17.5 24.5v-6.3l4.5-3.4 4.5 3.4v6.3h-3.2v-3.6h-2.6v3.6z" fill="${tone === 'verde' ? '#0D4720' : '#fff'}"/>
</svg>`
}

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

export const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'

/** Centro de Lugo, para mapas sin puntos. */
export const LUGO_CENTER: [number, number] = [43.0097, -7.5568]
