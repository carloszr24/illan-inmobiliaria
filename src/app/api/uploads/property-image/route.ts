import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { optimizePropertyImage } from '@/lib/optimize-image'
import { imageStore } from '@/lib/store'
import { SAFE_SEGMENT } from '@/lib/store/records'

// Vercel corta las peticiones de más de 4,5 MB: el límite propio queda por debajo.
// El panel reduce las fotos en el navegador antes de subirlas, así que un móvil de 12 MP entra sin problema.
const MAX_BYTES = 4 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const bad = (message: string, status = 400) => NextResponse.json({ error: message }, { status })

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return bad('No autorizado', 401)

  const propertyId = request.nextUrl.searchParams.get('propertyId')?.trim() || ''
  if (!SAFE_SEGMENT.test(propertyId)) return bad('propertyId no válido')

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return bad('Falta el archivo')
  if (!ALLOWED_TYPES.has(file.type)) return bad('Formato no permitido (usa JPG, PNG o WebP)')
  if (file.size > MAX_BYTES) return bad('La imagen supera los 4 MB')

  try {
    const optimized = await optimizePropertyImage(Buffer.from(await file.arrayBuffer()))
    const url = await imageStore().save(propertyId, optimized.data)
    return NextResponse.json({ url })
  } catch (error) {
    console.error('[uploads] No se pudo guardar la imagen:', error)
    return bad('No se pudo procesar la imagen', 500)
  }
}

/** Borra una foto subida desde el panel. Solo acepta URLs gestionadas por el almacén activo. */
export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return bad('No autorizado', 401)

  let url = ''
  try {
    url = String((await request.json())?.url || '')
  } catch {
    return bad('JSON inválido')
  }

  try {
    if (!(await imageStore().deleteByUrl(url))) return bad('URL no válida')
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[uploads] No se pudo borrar la imagen:', error)
    return bad('No se pudo borrar la imagen', 500)
  }
}
