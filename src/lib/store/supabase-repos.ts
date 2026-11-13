import { randomUUID } from 'crypto'
import { supabase } from '@/lib/store/supabase'
import {
  DbError,
  SAFE_SEGMENT,
  type ImageStore,
  type LeadRecord,
  type LeadRepo,
  type PropertyRecord,
  type PropertyRepo,
} from '@/lib/store/records'

/**
 * Motor Supabase (Postgres + Storage). El esquema está en supabase/schema.sql.
 * Todas las llamadas usan la clave de servicio y se hacen solo desde el servidor.
 */

type Row = Record<string, unknown>
type Mapping = [field: string, column: string][]

const fail = (error: { message: string; code?: string }): never => {
  throw new DbError(error.message, error.code)
}

function toRow(record: object, mapping: Mapping): Row {
  const source = record as Row
  const row: Row = {}
  for (const [field, column] of mapping) row[column] = source[field] === undefined ? null : source[field]
  return row
}

function fromRow(row: Row, mapping: Mapping): Row {
  const out: Row = {}
  for (const [field, column] of mapping) out[field] = row[column] === undefined ? null : row[column]
  return out
}

// ─── Propiedades ───────────────────────────────────────────────────────────────

const PROPERTY_MAP: Mapping = [
  ['id', 'id'], ['ref', 'ref'], ['title', 'title'], ['price', 'price'], ['location', 'location'],
  ['province', 'province'], ['type', 'type'], ['operation', 'operation'], ['status', 'status'],
  ['description', 'description'], ['images', 'images'], ['portalUrl', 'portal_url'],
  ['bedrooms', 'bedrooms'], ['bathrooms', 'bathrooms'], ['sqMeters', 'sq_meters'],
  ['availability', 'availability'], ['hotWater', 'hot_water'], ['heating', 'heating'],
  ['condition', 'condition'], ['propertyAge', 'property_age'], ['floor', 'floor'],
  ['garage', 'garage'], ['elevator', 'elevator'], ['furnished', 'furnished'], ['extras', 'extras'],
  ['energyRating', 'energy_rating'], ['energyValue', 'energy_value'],
  ['emissionsRating', 'emissions_rating'], ['emissionsValue', 'emissions_value'],
  ['lat', 'lat'], ['lon', 'lon'], ['ownerName', 'owner_name'], ['ownerPhone', 'owner_phone'],
  ['featured', 'featured'], ['archived', 'archived'], ['sortOrder', 'sort_order'], ['demo', 'demo'],
  ['createdAt', 'created_at'], ['updatedAt', 'updated_at'],
]

function propertyToRow(r: PropertyRecord): Row {
  return {
    ...toRow(r, PROPERTY_MAP),
    // columnas NOT NULL con valor por defecto en la base de datos
    images: typeof r.images === 'string' ? r.images : JSON.stringify(r.images ?? []),
    extras: Array.isArray(r.extras) ? r.extras : [],
    featured: Boolean(r.featured),
    archived: Boolean(r.archived),
    demo: Boolean(r.demo),
    sort_order: r.sortOrder ?? 0,
  }
}

function rowToProperty(row: Row): PropertyRecord {
  const rec = fromRow(row, PROPERTY_MAP)
  return {
    ...rec,
    images: typeof row.images === 'string' ? row.images : JSON.stringify(row.images ?? []),
    extras: Array.isArray(row.extras) ? (row.extras as string[]) : [],
    featured: Boolean(row.featured),
    archived: Boolean(row.archived),
    demo: Boolean(row.demo),
    sortOrder: typeof row.sort_order === 'number' ? row.sort_order : 0,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  } as unknown as PropertyRecord
}

export const supabasePropertyRepo: PropertyRepo = {
  async list() {
    const { data, error } = await supabase()
      .from('properties')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(1000)
    if (error) fail(error)
    return (data ?? []).map((row) => rowToProperty(row as Row))
  },

  async insert(record) {
    const { error } = await supabase().from('properties').insert(propertyToRow(record))
    if (error) fail(error)
  },

  async update(record) {
    const { id: _id, created_at: _created, ...changes } = propertyToRow(record)
    void _id
    void _created
    const { data, error } = await supabase().from('properties').update(changes).eq('id', record.id).select('id')
    if (error) fail(error)
    return (data?.length ?? 0) > 0
  },

  async remove(id) {
    const { data, error } = await supabase().from('properties').delete().eq('id', id).select('id')
    if (error) fail(error)
    return (data?.length ?? 0) > 0
  },

  async setSortOrders(ids) {
    const now = new Date().toISOString()
    const results = await Promise.all(
      ids.map((id, index) => supabase().from('properties').update({ sort_order: index, updated_at: now }).eq('id', id))
    )
    const failed = results.find((r) => r.error)
    if (failed?.error) fail(failed.error)
  },

  withLock: (fn) => fn(),
}

// ─── Leads ─────────────────────────────────────────────────────────────────────

const LEAD_MAP: Mapping = [
  ['id', 'id'], ['fullName', 'full_name'], ['email', 'email'], ['phone', 'phone'], ['source', 'source'],
  ['intent', 'intent'], ['status', 'status'], ['priority', 'priority'], ['propertyRef', 'property_ref'],
  ['notes', 'notes'], ['saleTimeline', 'sale_timeline'], ['assignedTo', 'assigned_to'],
  ['firstResponseAt', 'first_response_at'], ['lastContactAt', 'last_contact_at'],
  ['notifyStatus', 'notify_status'], ['notifyError', 'notify_error'], ['demo', 'demo'],
  ['createdAt', 'created_at'], ['updatedAt', 'updated_at'],
]

const leadToRow = (r: LeadRecord): Row => ({ ...toRow(r, LEAD_MAP), demo: Boolean(r.demo) })

function rowToLead(row: Row): LeadRecord {
  return {
    ...fromRow(row, LEAD_MAP),
    demo: Boolean(row.demo),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    firstResponseAt: row.first_response_at ? String(row.first_response_at) : null,
    lastContactAt: row.last_contact_at ? String(row.last_contact_at) : null,
  } as unknown as LeadRecord
}

export const supabaseLeadRepo: LeadRepo = {
  async list() {
    const { data, error } = await supabase().from('leads').select('*').order('created_at', { ascending: false }).limit(500)
    if (error) fail(error)
    return (data ?? []).map((row) => rowToLead(row as Row))
  },

  async get(id) {
    const { data, error } = await supabase().from('leads').select('*').eq('id', id).maybeSingle()
    if (error) fail(error)
    return data ? rowToLead(data as Row) : null
  },

  async insert(record) {
    const { error } = await supabase().from('leads').insert(leadToRow(record))
    if (error) fail(error)
  },

  async update(record) {
    const { id: _id, created_at: _created, ...changes } = leadToRow(record)
    void _id
    void _created
    const { data, error } = await supabase().from('leads').update(changes).eq('id', record.id).select('id')
    if (error) fail(error)
    return (data?.length ?? 0) > 0
  },

  async remove(id) {
    const { data, error } = await supabase().from('leads').delete().eq('id', id).select('id')
    if (error) fail(error)
    return (data?.length ?? 0) > 0
  },

  withLock: (fn) => fn(),
}

// ─── Fotos (Storage) ───────────────────────────────────────────────────────────

const BUCKET = 'property-images'
const OBJECT_PATH = /^properties\/[a-z0-9][a-z0-9-]*\/[a-f0-9-]{36}\.webp$/

export const supabaseImageStore: ImageStore = {
  async save(propertyId, data) {
    if (!SAFE_SEGMENT.test(propertyId)) throw new Error('Identificador de inmueble no válido')
    const objectPath = `properties/${propertyId}/${randomUUID()}.webp`
    const { error } = await supabase()
      .storage.from(BUCKET)
      .upload(objectPath, data, { contentType: 'image/webp', upsert: false, cacheControl: '31536000' })
    if (error) throw new Error(error.message)
    return supabase().storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl
  },

  async deleteByUrl(url) {
    const base = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '')
    if (!base) return false
    const prefix = `${base}/storage/v1/object/public/${BUCKET}/`
    if (!url.startsWith(prefix)) return false
    const objectPath = decodeURIComponent(url.slice(prefix.length).split('?')[0])
    if (!OBJECT_PATH.test(objectPath)) return false
    const { error } = await supabase().storage.from(BUCKET).remove([objectPath])
    if (error) throw new Error(error.message)
    return true
  },

  async deleteAllFor(propertyId) {
    if (!SAFE_SEGMENT.test(propertyId)) return
    const folder = `properties/${propertyId}`
    const { data, error } = await supabase().storage.from(BUCKET).list(folder, { limit: 200 })
    if (error) throw new Error(error.message)
    const paths = (data ?? []).filter((f) => f.name).map((f) => `${folder}/${f.name}`)
    if (paths.length === 0) return
    const { error: removeError } = await supabase().storage.from(BUCKET).remove(paths)
    if (removeError) throw new Error(removeError.message)
  },
}
