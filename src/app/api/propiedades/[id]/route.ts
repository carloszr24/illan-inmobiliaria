import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import {
  deleteProperty,
  getProperty,
  parsePropertyInput,
  PropertyError,
  updateProperty,
} from '@/lib/properties'

type Ctx = { params: Promise<{ id: string }> }

const unauthorized = () => NextResponse.json({ error: 'No autorizado' }, { status: 401 })

export async function GET(request: NextRequest, { params }: Ctx) {
  const { id } = await params
  const property = await getProperty(id, isAdminRequest(request))
  if (!property) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json(property)
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  if (!isAdminRequest(request)) return unauthorized()
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = parsePropertyInput(body)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  try {
    return NextResponse.json(await updateProperty(id, parsed.value))
  } catch (e) {
    if (e instanceof PropertyError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Error al actualizar la propiedad' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  if (!isAdminRequest(request)) return unauthorized()
  const { id } = await params
  try {
    await deleteProperty(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof PropertyError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Error al eliminar la propiedad' }, { status: 500 })
  }
}
