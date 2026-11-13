import type { Lead, Property } from '@/types'

/**
 * Contratos de la capa de datos. La app (properties.ts, leads-store.ts, rutas API) solo habla con
 * estas interfaces; detrás hay dos motores intercambiables:
 *   - JSON local   (carpeta data/, sin cuentas ni claves)         → src/lib/store/json-repos.ts
 *   - Supabase     (Postgres + Storage, si hay variables de entorno) → src/lib/store/supabase-repos.ts
 */

export type PropertyRecord = Omit<Property, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string }

export type LeadRecord = Omit<Lead, 'createdAt' | 'updatedAt' | 'firstResponseAt' | 'lastContactAt'> & {
  createdAt: string
  updatedAt: string
  firstResponseAt: string | null
  lastContactAt: string | null
}

export interface PropertyRepo {
  list(): Promise<PropertyRecord[]>
  /** Lanza un error con code "23505" si el id o la referencia ya existen. */
  insert(record: PropertyRecord): Promise<void>
  /** false si no existe. */
  update(record: PropertyRecord): Promise<boolean>
  /** false si no existe. */
  remove(id: string): Promise<boolean>
  setSortOrders(ids: string[]): Promise<void>
  /** Serializa secuencias leer-modificar-escribir. En Supabase no hace nada (usa restricciones de unicidad). */
  withLock<T>(fn: () => Promise<T>): Promise<T>
}

export interface LeadRepo {
  list(): Promise<LeadRecord[]>
  get(id: string): Promise<LeadRecord | null>
  insert(record: LeadRecord): Promise<void>
  update(record: LeadRecord): Promise<boolean>
  remove(id: string): Promise<boolean>
  withLock<T>(fn: () => Promise<T>): Promise<T>
}

export interface ImageStore {
  /** Guarda una foto ya optimizada (WebP) y devuelve la URL pública. */
  save(propertyId: string, data: Buffer): Promise<string>
  /** Borra una foto subida desde el panel. false si la URL no es una foto gestionada por este almacén. */
  deleteByUrl(url: string): Promise<boolean>
  /** Borra todas las fotos de un inmueble (al eliminarlo). */
  deleteAllFor(propertyId: string): Promise<void>
}

export class DbError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
  }
}

export const isUniqueViolation = (e: unknown): boolean =>
  typeof e === 'object' && e !== null && (e as { code?: string }).code === '23505'

export const SAFE_SEGMENT = /^[a-z0-9][a-z0-9-]*$/
