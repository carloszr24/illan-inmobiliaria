import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { DEMO_LEADS } from '@/data/demo-leads'
import { DEMO_PROPERTIES } from '@/data/demo-properties'
import { readCollection, uploadsDir, withCollection, writeCollection } from '@/lib/store/json-store'
import { SAFE_SEGMENT, type ImageStore, type LeadRecord, type LeadRepo, type PropertyRecord, type PropertyRepo } from '@/lib/store/records'

/**
 * Motor JSON local. Los métodos son primitivas SIN bloqueo propio; las secuencias leer-modificar-escribir
 * se protegen desde fuera con withLock (así no hay interbloqueos).
 */

const PROPS = 'properties'
const LEADS = 'leads'

const DEMO_COORDS = new Map(DEMO_PROPERTIES.map((p) => [p.id, { lat: p.lat ?? null, lon: p.lon ?? null }]))

async function readProps(): Promise<PropertyRecord[]> {
  const records = await readCollection<PropertyRecord>(PROPS, () => DEMO_PROPERTIES as PropertyRecord[])
  // Los ejemplos guardados antes de existir el mapa no tienen coordenadas: se completan al leer.
  // (Si alguien borra la ubicación desde el panel queda en null y no se vuelve a rellenar.)
  return records.map((r) => {
    if (!r.demo || r.lat !== undefined) return r
    const c = DEMO_COORDS.get(r.id)
    return c && c.lat != null && c.lon != null ? { ...r, lat: c.lat, lon: c.lon } : r
  })
}

export const jsonPropertyRepo: PropertyRepo = {
  list: readProps,
  async insert(record) {
    await writeCollection(PROPS, [...(await readProps()), record])
  },
  async update(record) {
    const all = await readProps()
    const index = all.findIndex((p) => p.id === record.id)
    if (index < 0) return false
    all[index] = record
    await writeCollection(PROPS, all)
    return true
  },
  async remove(id) {
    const all = await readProps()
    if (!all.some((p) => p.id === id)) return false
    await writeCollection(PROPS, all.filter((p) => p.id !== id))
    return true
  },
  async setSortOrders(ids) {
    const position = new Map(ids.map((id, i) => [id, i]))
    const next = (await readProps()).map((p) => (position.has(p.id) ? { ...p, sortOrder: position.get(p.id)! } : p))
    await writeCollection(PROPS, next)
  },
  withLock: (fn) => withCollection(PROPS, fn),
}

const readLeads = () => readCollection<LeadRecord>(LEADS, () => DEMO_LEADS as LeadRecord[])

export const jsonLeadRepo: LeadRepo = {
  list: readLeads,
  async get(id) {
    return (await readLeads()).find((l) => l.id === id) ?? null
  },
  async insert(record) {
    await writeCollection(LEADS, [record, ...(await readLeads())].slice(0, 2000))
  },
  async update(record) {
    const all = await readLeads()
    const index = all.findIndex((l) => l.id === record.id)
    if (index < 0) return false
    all[index] = record
    await writeCollection(LEADS, all)
    return true
  },
  async remove(id) {
    const all = await readLeads()
    if (!all.some((l) => l.id === id)) return false
    await writeCollection(LEADS, all.filter((l) => l.id !== id))
    return true
  },
  withLock: (fn) => withCollection(LEADS, fn),
}

export const jsonImageStore: ImageStore = {
  async save(propertyId, data) {
    if (!SAFE_SEGMENT.test(propertyId)) throw new Error('Identificador de inmueble no válido')
    const fileName = `${randomUUID()}.webp`
    const dir = path.join(/*turbopackIgnore: true*/ uploadsDir(), propertyId)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(/*turbopackIgnore: true*/ dir, fileName), data)
    return `/media/${propertyId}/${fileName}`
  },
  async deleteByUrl(url) {
    const m = /^\/media\/([a-z0-9][a-z0-9-]*)\/([a-f0-9-]{36}\.webp)$/.exec(url)
    if (!m) return false
    await fs.rm(path.join(/*turbopackIgnore: true*/ uploadsDir(), m[1], m[2]), { force: true })
    return true
  },
  async deleteAllFor(propertyId) {
    if (!SAFE_SEGMENT.test(propertyId)) return
    await fs.rm(path.join(/*turbopackIgnore: true*/ uploadsDir(), propertyId), { recursive: true, force: true })
  },
}
