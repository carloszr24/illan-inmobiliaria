/**
 * Lógica de los consejos en vivo del formulario de propiedades (título, descripción y fotos).
 * Funciones puras, sin dependencias: los componentes de src/components/admin/FormTips.tsx las usan.
 * Filosofía: AVISAR SIN BLOQUEAR. Ningún consejo impide guardar.
 */

/** Longitud a partir de la cual Google suele cortar el título en los resultados. */
export const TITLE_MAX = 60
/** Palabras a partir de las cuales una descripción se considera completa. */
export const DESCRIPTION_TARGET_WORDS = 120
/** Peso objetivo por foto, ya reducida. */
export const PHOTO_TARGET_BYTES = 300 * 1024
/** Número de fotos a partir del cual se da por bueno el reportaje. */
export const PHOTOS_RECOMMENDED = 8

const LETTER = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g

export function wordCount(text: string): number {
  return (text.trim().match(/\S+/g) ?? []).length
}

/** ¿Está (casi) todo en mayúsculas? Ignora textos cortos y siglas sueltas. */
export function isShouting(text: string, minLetters = 12): boolean {
  const letters = text.match(LETTER) ?? []
  if (letters.length < minLetters) return false
  const upper = letters.filter((c) => c !== c.toLowerCase()).length
  return upper / letters.length > 0.7
}

function normalizeTitle(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Mismo título (sin mayúsculas, tildes ni espacios de más). */
export function sameTitle(a: string, b: string): boolean {
  const x = normalizeTitle(a)
  return x.length > 0 && x === normalizeTitle(b)
}

export function formatSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export const DESCRIPTION_CHECKLIST = [
  'Tipo de inmueble y zona: barrio o calle y qué hay cerca (Muralla, Praza Maior, colegios, centro de salud…).',
  'Superficie y distribución: m², dormitorios, baños, salón, cocina, terraza o balcón.',
  'Estado y reformas: año de la reforma, suelos, ventanas, baños y cocina.',
  'Luz y orientación: exterior o interior, vistas, planta y si hay ascensor.',
  'Extras: garaje, trastero, piscina, zonas comunes, amueblado.',
  'Calefacción y certificado energético.',
  'Comunidad y gastos aproximados.',
  'Entorno y comunicaciones: comercios, transporte, accesos.',
  'Disponibilidad y cómo concertar una visita.',
] as const

/** Ejemplo orientativo (≥ 120 palabras). Los datos son inventados: se sustituyen por los reales. */
export const DESCRIPTION_EXAMPLE =
  'Piso exterior de 3 dormitorios y 2 baños en pleno centro de Lugo, a cinco minutos andando de la Praza Maior y de la ' +
  'Muralla. Tiene 105 m² útiles muy luminosos, con salón de 25 m² con salida a balcón, cocina independiente equipada y ' +
  'dormitorios con armarios empotrados. Reformado en 2022: suelos de parquet, ventanas de climalit, calefacción de gas ' +
  'individual y baños nuevos. Edificio con ascensor y portal reformado; posibilidad de plaza de garaje en el mismo ' +
  'edificio. Zona con supermercados, colegios, centro de salud y transporte urbano a la puerta. Certificado energético D ' +
  'y gastos de comunidad bajos. Una vivienda cómoda para vivir todo el año, ideal para familias o como inversión para ' +
  'alquilar en una zona con mucha demanda. Disponible de inmediato; te lo enseñamos cuando quieras.'

export const TITLE_EXAMPLE = 'Piso reformado de 3 dormitorios y garaje en Garabolos, Lugo'
