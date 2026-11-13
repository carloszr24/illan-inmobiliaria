import { DEMO_PROPERTIES } from '@/data/demo-properties'
import type { Property } from '@/types'
import { imageStore, propertyRepo } from '@/lib/store'
import { isUniqueViolation, type PropertyRecord } from '@/lib/store/records'
import { normalizeExtraIds, propertyHasExtra, syncLegacyExtraFields } from '@/lib/property-extras'
import {
  DEFAULT_PROVINCE,
  MAX_FEATURED_ON_HOME,
  PROPERTY_OPERATIONS,
  PROPERTY_PROVINCES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from '@/lib/utils'

const toProperty = (r: PropertyRecord): Property => ({
  ...r,
  createdAt: new Date(r.createdAt),
  updatedAt: new Date(r.updatedAt),
})

/** Vista pública: sin los datos privados del propietario (solo el panel de administración los recibe). */
const toPublicProperty = (r: PropertyRecord): Property => ({ ...toProperty(r), ownerName: null, ownerPhone: null })

const sortForDisplay = (list: PropertyRecord[]) =>
  [...list].sort((a, b) => {
    const diff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    if (diff !== 0) return diff
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

/** Lectura del catálogo desde el motor activo (JSON local o Supabase). */
const load = (): Promise<PropertyRecord[]> => propertyRepo().list()

// ─── Lectura ───────────────────────────────────────────────────────────────────

/** Todos los inmuebles, incluidos los archivados (solo para el panel admin). */
export async function listAllProperties(): Promise<Property[]> {
  return sortForDisplay(await load()).map(toProperty)
}

/** Inmuebles visibles en la web pública. */
export async function listPublicProperties(): Promise<Property[]> {
  return sortForDisplay((await load()).filter((p) => !p.archived)).map(toPublicProperty)
}

export async function getPublicPropertyById(id: string): Promise<Property | undefined> {
  const found = (await load()).find((p) => p.id === id && !p.archived)
  return found ? toPublicProperty(found) : undefined
}

export async function getPropertyById(id: string): Promise<Property | undefined> {
  const found = (await load()).find((p) => p.id === id)
  return found ? toProperty(found) : undefined
}

/** Ficha por id: los archivados solo se devuelven si `includeArchived` (admin). */
export async function getProperty(id: string, includeArchived: boolean): Promise<Property | undefined> {
  return includeArchived ? getPropertyById(id) : getPublicPropertyById(id)
}

export async function listFeaturedForHome(): Promise<Property[]> {
  return sortForDisplay((await load()).filter((p) => p.featured && !p.archived))
    .slice(0, MAX_FEATURED_ON_HOME)
    .map(toPublicProperty)
}

// ─── Filtros públicos ─────────────────────────────────────────────────────────

export type PublicSearchParams = {
  type?: string
  operation?: string
  status?: string
  minPrice?: string
  maxPrice?: string
  bedrooms?: string
  extras?: string
  q?: string
}

function matchesBedrooms(property: Property, minBedrooms: string): boolean {
  if (property.bedrooms == null) return false
  const min = Number(minBedrooms)
  if (Number.isNaN(min)) return true
  return min >= 4 ? property.bedrooms >= 4 : property.bedrooms === min
}

export function filterProperties(properties: Property[], params: PublicSearchParams): Property[] {
  let list = [...properties]
  if (params.type) list = list.filter((p) => p.type === params.type)
  if (params.operation) list = list.filter((p) => (p.operation || 'venta') === params.operation)
  if (params.status) list = list.filter((p) => p.status === params.status)
  if (params.minPrice) {
    const min = parseFloat(params.minPrice)
    if (!Number.isNaN(min)) list = list.filter((p) => p.price >= min)
  }
  if (params.maxPrice) {
    const max = parseFloat(params.maxPrice)
    if (!Number.isNaN(max)) list = list.filter((p) => p.price > 0 && p.price <= max)
  }
  if (params.bedrooms) list = list.filter((p) => matchesBedrooms(p, params.bedrooms!))
  const extras = (params.extras || '').split(',').map((e) => e.trim()).filter(Boolean)
  if (extras.length) list = list.filter((p) => extras.every((e) => propertyHasExtra(p, e)))
  if (params.q) {
    const needle = params.q.trim().toLowerCase()
    if (needle) {
      list = list.filter((p) =>
        `${p.title} ${p.location} ${p.ref ?? ''} ${p.description}`.toLowerCase().includes(needle)
      )
    }
  }
  return list
}

// ─── Escritura ────────────────────────────────────────────────────────────────

export type PropertyInput = {
  title: string
  price: number
  location: string
  province: string
  type: string
  operation: string
  status: string
  description: string
  images: string[]
  portalUrl: string | null
  bedrooms: number | null
  bathrooms: number | null
  sqMeters: number | null
  availability: string | null
  hotWater: string | null
  heating: string | null
  condition: string | null
  propertyAge: string | null
  floor: string | null
  extras: string[]
  energyRating: string | null
  energyValue: number | null
  emissionsRating: string | null
  emissionsValue: number | null
  lat: number | null
  lon: number | null
  ownerName: string | null
  ownerPhone: string | null
  featured: boolean
}

const text = (v: unknown): string | null => {
  const s = typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim()
  return s ? s : null
}

const num = (v: unknown, integer = false): number | null => {
  if (v === '' || v == null) return null
  const n = integer ? parseInt(String(v), 10) : parseFloat(String(v))
  return Number.isFinite(n) ? n : null
}

function normalizePortalUrl(value: unknown): string | null {
  const s = text(value)
  if (!s) return null
  const withProtocol = /^https?:\/\//i.test(s) ? s : `https://${s}`
  try {
    return new URL(withProtocol).toString()
  } catch {
    return null
  }
}

/** Valida y normaliza el cuerpo recibido del panel. Devuelve `error` si algo no es válido. */
export function parsePropertyInput(body: unknown): { value: PropertyInput } | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Datos no válidos' }
  const b = body as Record<string, unknown>

  const title = text(b.title)
  const location = text(b.location)
  const description = text(b.description)
  if (!title) return { error: 'El título es obligatorio' }
  if (!location) return { error: 'La ubicación es obligatoria' }
  if (!description) return { error: 'La descripción es obligatoria' }

  const price = num(b.price)
  if (price == null || price < 0) return { error: 'El precio no es válido' }

  const type = String(b.type || 'piso')
  if (!(PROPERTY_TYPES as readonly string[]).includes(type)) return { error: 'Tipo de inmueble no válido' }
  const operation = String(b.operation || 'venta')
  if (!(PROPERTY_OPERATIONS as readonly string[]).includes(operation)) return { error: 'Operación no válida' }
  const status = String(b.status || 'disponible')
  if (!(PROPERTY_STATUSES as readonly string[]).includes(status)) return { error: 'Estado no válido' }
  const province = text(b.province) || DEFAULT_PROVINCE
  if (!(PROPERTY_PROVINCES as readonly string[]).includes(province)) return { error: 'Provincia no válida' }

  const images = Array.isArray(b.images)
    ? b.images.map(String).filter((u) => u.startsWith('/') || /^https?:\/\//i.test(u))
    : []

  const ownerName = text(b.ownerName)?.slice(0, 120) ?? null
  const ownerPhone = text(b.ownerPhone)?.slice(0, 40) ?? null
  if (ownerPhone && !/^\+?[\d\s().-]{6,}$/.test(ownerPhone)) {
    return { error: 'El teléfono del propietario no es válido (solo números, espacios, + y guiones)' }
  }

  const lat = num(b.lat)
  const lon = num(b.lon)
  if ((lat == null) !== (lon == null)) return { error: 'La ubicación del mapa está incompleta' }
  if (lat != null && lon != null && (lat < -90 || lat > 90 || lon < -180 || lon > 180)) {
    return { error: 'La ubicación del mapa no es válida' }
  }

  return {
    value: {
      title,
      price,
      location,
      province,
      type,
      operation,
      status,
      description,
      images,
      portalUrl: normalizePortalUrl(b.portalUrl),
      bedrooms: num(b.bedrooms, true),
      bathrooms: num(b.bathrooms, true),
      sqMeters: num(b.sqMeters),
      availability: text(b.availability),
      hotWater: text(b.hotWater),
      heating: text(b.heating),
      condition: text(b.condition),
      propertyAge: text(b.propertyAge),
      floor: text(b.floor),
      extras: normalizeExtraIds(b.extras ?? []),
      energyRating: text(b.energyRating)?.toUpperCase() ?? null,
      energyValue: num(b.energyValue),
      emissionsRating: text(b.emissionsRating)?.toUpperCase() ?? null,
      emissionsValue: num(b.emissionsValue),
      lat: lat != null ? Math.round(lat * 1e6) / 1e6 : null,
      lon: lon != null ? Math.round(lon * 1e6) / 1e6 : null,
      ownerName,
      ownerPhone,
      featured: Boolean(b.featured),
    },
  }
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
  return base || `propiedad-${Date.now()}`
}

function uniqueId(base: string, existing: PropertyRecord[]): string {
  const ids = new Set(existing.map((p) => p.id))
  let candidate = base
  let n = 2
  while (ids.has(candidate)) candidate = `${base}-${n++}`
  return candidate
}

function nextRef(existing: PropertyRecord[]): string {
  const max = existing.reduce((acc, p) => {
    const m = /^ILL-(\d+)$/.exec(p.ref ?? '')
    return m ? Math.max(acc, Number(m[1])) : acc
  }, 0)
  return `ILL-${String(max + 1).padStart(4, '0')}`
}

function applyInput(input: PropertyInput): Omit<PropertyRecord, 'id' | 'ref' | 'archived' | 'sortOrder' | 'demo' | 'createdAt' | 'updatedAt'> {
  const legacy = syncLegacyExtraFields(input.extras as never)
  return {
    title: input.title,
    price: input.price,
    location: input.location,
    province: input.province,
    type: input.type,
    operation: input.operation,
    status: input.status,
    description: input.description,
    images: JSON.stringify(input.images),
    portalUrl: input.portalUrl,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    sqMeters: input.sqMeters,
    availability: input.availability,
    hotWater: input.hotWater,
    heating: input.heating || (input.extras.includes('heating') ? 'Sí' : null),
    condition: input.condition,
    propertyAge: input.propertyAge,
    floor: input.floor,
    garage: legacy.garage,
    elevator: legacy.elevator,
    furnished: legacy.furnished,
    extras: input.extras,
    energyRating: input.energyRating,
    energyValue: input.energyValue,
    emissionsRating: input.emissionsRating,
    emissionsValue: input.emissionsValue,
    lat: input.lat,
    lon: input.lon,
    ownerName: input.ownerName,
    ownerPhone: input.ownerPhone,
    featured: input.featured,
  }
}

export function featuredLimitError(
  records: Pick<Property, 'id' | 'featured' | 'archived'>[],
  wantFeatured: boolean,
  editingId: string | null
): string | null {
  if (!wantFeatured) return null
  const featuredIds = records.filter((p) => p.featured && !p.archived).map((p) => p.id)
  if (editingId && featuredIds.includes(editingId)) return null
  if (featuredIds.length >= MAX_FEATURED_ON_HOME) {
    return `Solo puedes tener ${MAX_FEATURED_ON_HOME} destacadas en la home. Quita la marca en otra propiedad primero.`
  }
  return null
}

export class PropertyError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
  }
}

export async function createProperty(input: PropertyInput): Promise<Property> {
  const repo = propertyRepo()
  return repo.withLock(async () => {
    for (let attempt = 0; ; attempt++) {
      const records = await repo.list()
      const capError = featuredLimitError(records, input.featured, null)
      if (capError) throw new PropertyError(capError)

      const now = new Date().toISOString()
      const record: PropertyRecord = {
        id: uniqueId(slugify(input.title), records),
        ref: nextRef(records),
        ...applyInput(input),
        archived: false,
        sortOrder: records.reduce((acc, p) => Math.max(acc, p.sortOrder ?? 0), -1) + 1,
        createdAt: now,
        updatedAt: now,
      }
      try {
        await repo.insert(record)
        return toProperty(record)
      } catch (e) {
        // Dos altas simultáneas pueden generar el mismo id o referencia: se reintenta con datos frescos
        if (isUniqueViolation(e) && attempt < 4) continue
        throw e
      }
    }
  })
}

export async function updateProperty(id: string, input: PropertyInput): Promise<Property> {
  const repo = propertyRepo()
  return repo.withLock(async () => {
    const records = await repo.list()
    const current = records.find((p) => p.id === id)
    if (!current) throw new PropertyError('No encontrada', 404)
    const capError = featuredLimitError(records, input.featured, id)
    if (capError) throw new PropertyError(capError)

    const updated: PropertyRecord = {
      ...current,
      ...applyInput(input),
      featured: current.archived ? false : input.featured,
      updatedAt: new Date().toISOString(),
    }
    if (!(await repo.update(updated))) throw new PropertyError('No encontrada', 404)
    return toProperty(updated)
  })
}

export async function setPropertyArchived(id: string, archived: boolean): Promise<Property> {
  const repo = propertyRepo()
  return repo.withLock(async () => {
    const current = (await repo.list()).find((p) => p.id === id)
    if (!current) throw new PropertyError('No encontrada', 404)
    const updated: PropertyRecord = {
      ...current,
      archived,
      featured: archived ? false : current.featured,
      updatedAt: new Date().toISOString(),
    }
    if (!(await repo.update(updated))) throw new PropertyError('No encontrada', 404)
    return toProperty(updated)
  })
}

export async function reorderProperties(ids: string[]): Promise<void> {
  const repo = propertyRepo()
  await repo.withLock(() => repo.setSortOrders(ids))
}

export async function deleteProperty(id: string): Promise<void> {
  const repo = propertyRepo()
  await repo.withLock(async () => {
    if (!(await repo.remove(id))) throw new PropertyError('No encontrada', 404)
  })
  // Las fotos subidas se borran con el inmueble (si falla, queda constancia en el log pero no se bloquea el borrado)
  await imageStore()
    .deleteAllFor(id)
    .catch((e) => console.error('[properties] No se pudieron borrar las fotos de', id, e))
}

/** Carga los inmuebles de ejemplo, solo si el catálogo está vacío. Devuelve cuántos se han creado. */
export async function seedDemoProperties(): Promise<number> {
  const repo = propertyRepo()
  return repo.withLock(async () => {
    if ((await repo.list()).length > 0) {
      throw new PropertyError('Los ejemplos solo se cargan en un catálogo vacío', 409)
    }
    const now = new Date().toISOString()
    for (const demo of DEMO_PROPERTIES) {
      await repo.insert({ ...(demo as PropertyRecord), createdAt: now, updatedAt: now })
    }
    return DEMO_PROPERTIES.length
  })
}

/**
 * Elimina SOLO los inmuebles marcados como ejemplo (demo), con sus fotos subidas si las hubiera.
 * Los inmuebles reales no se tocan. Devuelve cuántos se han eliminado.
 */
export async function deleteDemoProperties(): Promise<number> {
  const repo = propertyRepo()
  const demos = (await repo.list()).filter((p) => p.demo)
  let removed = 0
  for (const demo of demos) {
    if (await repo.withLock(() => repo.remove(demo.id))) removed++
    await imageStore()
      .deleteAllFor(demo.id)
      .catch((e) => console.error('[properties] No se pudieron borrar las fotos de', demo.id, e))
  }
  return removed
}
