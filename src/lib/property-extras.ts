import type { Property } from '@/types'

export const PROPERTY_EXTRA_OPTIONS = [
  { value: 'garage', label: 'Garaje' },
  { value: 'elevator', label: 'Ascensor' },
  { value: 'furnished', label: 'Amueblado' },
  { value: 'heating', label: 'Calefacción' },
  { value: 'pool', label: 'Piscina' },
  { value: 'storage', label: 'Trastero' },
  { value: 'common_areas', label: 'Zonas comunes' },
] as const

export type PropertyExtraId = (typeof PROPERTY_EXTRA_OPTIONS)[number]['value']

const VALID_EXTRA_IDS = new Set<string>(PROPERTY_EXTRA_OPTIONS.map((option) => option.value))

export function getExtraLabel(extraId: string): string {
  return PROPERTY_EXTRA_OPTIONS.find((option) => option.value === extraId)?.label ?? extraId
}

export function normalizeExtraIds(values: unknown): PropertyExtraId[] {
  if (!Array.isArray(values)) return []
  const unique = new Set<PropertyExtraId>()
  for (const value of values) {
    const id = String(value).trim()
    if (VALID_EXTRA_IDS.has(id)) unique.add(id as PropertyExtraId)
  }
  return Array.from(unique)
}

export function parseExtrasColumn(value: unknown): PropertyExtraId[] {
  if (Array.isArray(value)) return normalizeExtraIds(value)
  if (typeof value === 'string' && value.trim()) {
    try {
      return normalizeExtraIds(JSON.parse(value))
    } catch {
      return normalizeExtraIds(value.split(','))
    }
  }
  return []
}

function hasLegacyYes(value?: string | null): boolean {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  if (!normalized) return false
  return normalized === 'si' || normalized === 'sí' || normalized === 'true' || normalized.startsWith('con ')
}

function inferExtrasFromLegacyFields(property: Property): PropertyExtraId[] {
  const extras: PropertyExtraId[] = []
  const text = property.description.toLowerCase()

  if (hasLegacyYes(property.garage) || /plaza de garaje|garaje/i.test(text)) extras.push('garage')
  if (hasLegacyYes(property.elevator)) extras.push('elevator')
  if (hasLegacyYes(property.furnished)) extras.push('furnished')
  if (hasLegacyYes(property.heating)) extras.push('heating')
  if (/piscina/i.test(text)) extras.push('pool')
  if (/trastero/i.test(text)) extras.push('storage')
  if (/zonas comunes/i.test(text)) extras.push('common_areas')

  return extras
}

export function getPropertyExtras(property: Property): PropertyExtraId[] {
  const stored = normalizeExtraIds(property.extras ?? [])
  if (stored.length > 0) return stored
  return inferExtrasFromLegacyFields(property)
}

export function propertyHasExtra(property: Property, extraId: string): boolean {
  return getPropertyExtras(property).includes(extraId as PropertyExtraId)
}

export function syncLegacyExtraFields(extras: PropertyExtraId[]) {
  return {
    garage: extras.includes('garage') ? 'Sí' : null,
    elevator: extras.includes('elevator') ? 'Sí' : null,
    furnished: extras.includes('furnished') ? 'Sí' : null,
  }
}
