import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { seedDemoLeads } from '@/lib/leads-store'
import { PropertyError, seedDemoProperties } from '@/lib/properties'

/**
 * Carga los inmuebles y contactos de EJEMPLO. Solo con sesión de admin y solo si el catálogo está vacío
 * (nunca se mezclan con datos reales). Es una acción explícita: nada se siembra solo en Supabase.
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const properties = await seedDemoProperties()
    const leads = await seedDemoLeads()
    return NextResponse.json({ ok: true, properties, leads })
  } catch (e) {
    if (e instanceof PropertyError) return NextResponse.json({ error: e.message }, { status: e.status })
    console.error('[seed-demo]', e)
    return NextResponse.json({ error: 'No se pudieron cargar los ejemplos' }, { status: 500 })
  }
}
