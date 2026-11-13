import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Texto que se muestra cuando un inmueble se publica sin precio. */
export const PRICE_ON_REQUEST_LABEL = 'Solicitar información'

/** Un inmueble "sin precio" se guarda con precio 0 (la web muestra «Solicitar información»). */
export const hasPrice = (price: number | null | undefined): price is number => typeof price === 'number' && price > 0

export function formatPrice(price: number, operation?: string): string {
  if (!hasPrice(price)) return PRICE_ON_REQUEST_LABEL
  const base = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price)
  return operation === 'alquiler' ? `${base}/mes` : base
}

export function parseImages(images: string): string[] {
  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

/** Máximo de inmuebles destacados en la página de inicio. */
export const MAX_FEATURED_ON_HOME = 3

export const PROPERTY_TYPES = ['piso', 'casa', 'local', 'terreno', 'oficina', 'garaje'] as const
export const PROPERTY_OPERATIONS = ['venta', 'alquiler'] as const
export const PROPERTY_STATUSES = ['disponible', 'reservado', 'vendido'] as const
export const PROPERTY_PROVINCES = ['Lugo', 'A Coruña', 'Ourense', 'Pontevedra', 'Asturias', 'León'] as const
export const DEFAULT_PROVINCE = 'Lugo'

export const BEDROOM_FILTER_OPTIONS = ['1', '2', '3', '4'] as const

export const STATUS_LABELS: Record<string, string> = {
  disponible: 'Disponible',
  reservado: 'Reservado',
  vendido: 'Vendido',
}

/** Etiquetas de estado en fichas y listado público. */
export const STATUS_BADGE_CLASSES: Record<string, string> = {
  disponible: 'text-brand-green-dark bg-brand-green-tint border-brand-green/30',
  reservado: 'text-amber-800 bg-amber-50 border-amber-200',
  vendido: 'text-red-700 bg-red-50 border-red-200',
}

/** Etiquetas de estado en el panel admin (sin borde). */
export const STATUS_BADGE_CLASSES_ADMIN: Record<string, string> = {
  disponible: 'text-brand-green-dark bg-brand-green-tint',
  reservado: 'text-amber-800 bg-amber-50',
  vendido: 'text-red-700 bg-red-50',
}

export const TYPE_LABELS: Record<string, string> = {
  piso: 'Piso',
  casa: 'Casa',
  local: 'Local',
  terreno: 'Terreno',
  oficina: 'Oficina',
  garaje: 'Plaza de garaje',
}

export const OPERATION_LABELS: Record<string, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
}
