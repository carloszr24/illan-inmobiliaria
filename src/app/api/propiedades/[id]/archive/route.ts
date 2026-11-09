import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { PropertyError, setPropertyArchived } from '@/lib/properties'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params

  let archived: unknown
  try {
    archived = (await request.json())?.archived
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  if (typeof archived !== 'boolean') return NextResponse.json({ error: 'Falta "archived"' }, { status: 400 })

  try {
    return NextResponse.json(await setPropertyArchived(id, archived))
  } catch (e) {
    if (e instanceof PropertyError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Error al archivar' }, { status: 500 })
  }
}
