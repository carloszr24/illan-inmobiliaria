import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import {
  createProperty,
  listAllProperties,
  listPublicProperties,
  parsePropertyInput,
  PropertyError,
} from '@/lib/properties'

const unauthorized = () => NextResponse.json({ error: 'No autorizado' }, { status: 401 })

/** Público: solo inmuebles publicados. Con sesión de admin: todos (incluidos archivados). */
export async function GET(request: NextRequest) {
  const properties = isAdminRequest(request) ? await listAllProperties() : await listPublicProperties()
  return NextResponse.json(properties)
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = parsePropertyInput(body)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  try {
    const property = await createProperty(parsed.value)
    return NextResponse.json(property, { status: 201 })
  } catch (e) {
    if (e instanceof PropertyError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Error al crear la propiedad' }, { status: 500 })
  }
}
