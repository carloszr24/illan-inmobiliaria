import { promises as fs } from 'fs'
import path from 'path'

/**
 * Almacén local en archivos JSON. Sustituye a cualquier base de datos externa:
 * no necesita cuentas, claves ni servicios de terceros.
 *
 * - Carpeta de datos: ./data (o ILLAN_DATA_DIR). Está en .gitignore.
 * - Las escrituras son atómicas (archivo temporal + rename) y se serializan por colección.
 * - Pensado para un único proceso Node con disco persistente (VPS, Docker con volumen, etc.).
 *   Si en el futuro hace falta escalar a varias instancias, esta capa es lo único que habría
 *   que cambiar por una base de datos real (Postgres, SQLite…): el resto de la app no la toca.
 */

export function dataDir(): string {
  const custom = process.env.ILLAN_DATA_DIR?.trim()
  return custom ? path.resolve(custom) : path.join(/*turbopackIgnore: true*/ process.cwd(), 'data')
}

export function uploadsDir(): string {
  return path.join(/*turbopackIgnore: true*/ dataDir(), 'uploads')
}

const globalForStore = globalThis as unknown as { __illanQueues?: Map<string, Promise<unknown>> }
const queues = (globalForStore.__illanQueues ??= new Map<string, Promise<unknown>>())

/** Serializa operaciones de lectura-modificación-escritura sobre una misma colección. */
export function withCollection<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const previous = queues.get(name) ?? Promise.resolve()
  const next = previous.then(fn, fn)
  queues.set(
    name,
    next.catch(() => undefined)
  )
  return next
}

function collectionFile(name: string): string {
  return path.join(/*turbopackIgnore: true*/ dataDir(), `${name}.json`)
}

export async function readCollection<T>(name: string, seed: () => T[]): Promise<T[]> {
  const file = collectionFile(name)
  try {
    const raw = await fs.readFile(file, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    const initial = seed()
    await writeCollection(name, initial)
    return initial
  }
}

export async function writeCollection<T>(name: string, items: T[]): Promise<void> {
  const file = collectionFile(name)
  await fs.mkdir(path.dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`
  await fs.writeFile(tmp, JSON.stringify(items, null, 2), 'utf8')
  await fs.rename(tmp, file)
}
