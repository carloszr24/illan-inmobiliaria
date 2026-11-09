import { accessSync, constants, mkdirSync } from 'fs'
import { promises as fs } from 'fs'
import os from 'os'
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
 *
 * MODO DEMOSTRACIÓN: en plataformas sin disco persistente (p. ej. Vercel, donde el código vive
 * en un sistema de archivos de solo lectura) la carpeta de datos no es escribible. En ese caso
 * se usa una carpeta temporal del sistema: la web funciona y se puede probar el panel, pero
 * los cambios son efímeros (se pierden al reiniciar la instancia). Queda constancia en el log.
 */

type Resolved = { dir: string; persistent: boolean }

const globalForStore = globalThis as unknown as {
  __illanQueues?: Map<string, Promise<unknown>>
  __illanStore?: Resolved
}
const queues = (globalForStore.__illanQueues ??= new Map<string, Promise<unknown>>())

function isWritable(dir: string): boolean {
  try {
    mkdirSync(dir, { recursive: true })
    accessSync(dir, constants.W_OK)
    return true
  } catch {
    return false
  }
}

function resolveStore(): Resolved {
  if (globalForStore.__illanStore) return globalForStore.__illanStore

  const custom = process.env.ILLAN_DATA_DIR?.trim()
  const preferred = custom ? path.resolve(custom) : path.join(/*turbopackIgnore: true*/ process.cwd(), 'data')

  const resolved: Resolved = isWritable(preferred)
    ? { dir: preferred, persistent: true }
    : { dir: path.join(os.tmpdir(), 'illan-data'), persistent: false }

  if (!resolved.persistent) {
    mkdirSync(resolved.dir, { recursive: true })
    console.warn(
      `[illan] La carpeta de datos (${preferred}) no es escribible: modo demostración, los cambios no se guardan de forma permanente.`
    )
  }
  globalForStore.__illanStore = resolved
  return resolved
}

export function dataDir(): string {
  return resolveStore().dir
}

export function uploadsDir(): string {
  return path.join(/*turbopackIgnore: true*/ dataDir(), 'uploads')
}

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
