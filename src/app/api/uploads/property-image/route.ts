import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { optimizePropertyImage } from '@/lib/optimize-image'
import { uploadsDir } from '@/lib/store/json-store'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const SAFE_SEGMENT = /^[a-z0-9][a-z0-9-]*$/
const SAFE_FILE = /^[a-f0-9-]{36}\.webp$/

const bad = (message: string, status = 400) => NextResponse.json({ error: message }, { status })

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return bad('No autorizado', 401)

  const propertyId = request.nextUrl.searchParams.get('propertyId')?.trim() || ''
  if (!SAFE_SEGMENT.test(propertyId)) return bad('propertyId no válido')

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return bad('Falta el archivo')
  if (!ALLOWED_TYPES.has(file.type)) return bad('Formato no permitido (usa JPG, PNG o WebP)')
  if (file.size > MAX_BYTES) return bad('La imagen supera los 5 MB')

  try {
    const optimized = await optimizePropertyImage(Buffer.from(await file.arrayBuffer()))
    const fileName = `${randomUUID()}.${optimized.ext}`
    const dir = path.join(/*turbopackIgnore: true*/ uploadsDir(), propertyId)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(/*turbopackIgnore: true*/ dir, fileName), optimized.data)
    return NextResponse.json({ url: `/media/${propertyId}/${fileName}` })
  } catch {
    return bad('No se pudo procesar la imagen', 500)
  }
}

/** Borra una foto subida. Solo acepta URLs /media/<propiedad>/<uuid>.webp. */
export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return bad('No autorizado', 401)

  let url = ''
  try {
    url = String((await request.json())?.url || '')
  } catch {
    return bad('JSON inválido')
  }

  const match = /^\/media\/([a-z0-9][a-z0-9-]*)\/([a-f0-9-]{36}\.webp)$/.exec(url)
  if (!match || !SAFE_SEGMENT.test(match[1]) || !SAFE_FILE.test(match[2])) return bad('URL no válida')

  await fs.rm(path.join(/*turbopackIgnore: true*/ uploadsDir(), match[1], match[2]), { force: true })
  return NextResponse.json({ ok: true })
}
