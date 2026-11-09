import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { reorderProperties } from '@/lib/properties'

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let ids: unknown
  try {
    ids = (await request.json())?.ids
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === 'string')) {
    return NextResponse.json({ error: 'Lista de ids no válida' }, { status: 400 })
  }

  await reorderProperties(ids as string[])
  return NextResponse.json({ ok: true })
}
