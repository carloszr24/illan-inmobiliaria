import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { getClientIp } from '@/lib/admin-security'
import {
  createLead,
  deleteLead,
  isLeadPriority,
  isLeadStatus,
  listLeads,
  updateLead,
  type LeadPatch,
} from '@/lib/leads-store'
import { sendLeadNotification } from '@/lib/lead-notification'
import { checkRateLimit } from '@/lib/rate-limiter'

const unauthorized = () => NextResponse.json({ error: 'No autorizado' }, { status: 401 })
const clip = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max)

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized()
  return NextResponse.json(await listLeads())
}

/** Público: formulario de contacto y de valoración. Limitado por IP y con campo trampa anti-bots. */
export async function POST(request: NextRequest) {
  const rate = await checkRateLimit(`leads:${getClientIp(request)}`, {
    maxAttempts: 5,
    windowMinutes: 60,
    blockMinutes: 60,
  })
  if (!rate.allowed) {
    const retryAfterSec = rate.retryAfter ? Math.max(1, Math.ceil((rate.retryAfter.getTime() - Date.now()) / 1000)) : 3600
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Inténtalo más tarde.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // Campo trampa: los bots lo rellenan, las personas no lo ven. Se responde "ok" sin guardar nada.
  if (clip(body.website, 200)) return NextResponse.json({ ok: true }, { status: 201 })

  const fullName = clip(body.fullName, 120)
  const phone = clip(body.phone, 40)
  const email = clip(body.email, 160) || null
  if (!fullName || !phone) {
    return NextResponse.json({ error: 'Nombre y teléfono son obligatorios' }, { status: 400 })
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'El email no es válido' }, { status: 400 })
  }

  // Desde la web pública solo se admiten estos orígenes e intenciones.
  const source = body.source === 'web_valoracion' ? 'web_valoracion' : 'web_contacto'
  const intent = ['comprar', 'vender', 'alquilar'].includes(String(body.intent)) ? (body.intent as 'comprar' | 'vender' | 'alquilar') : 'otro'

  let lead
  try {
    lead = await createLead({
      fullName,
      phone,
      email,
      notes: clip(body.notes, 4000) || null,
      source,
      intent,
      priority: source === 'web_valoracion' ? 'alta' : 'media',
      propertyRef: clip(body.propertyRef, 60) || null,
      saleTimeline: clip(body.saleTimeline, 80) || null,
    })
  } catch (error) {
    console.error('[leads] No se pudo guardar el contacto:', error)
    return NextResponse.json({ error: 'No se pudo guardar el mensaje' }, { status: 500 })
  }

  // El contacto ya está guardado: el aviso por email nunca puede hacer fallar la petición.
  // Se espera al envío (en serverless no se puede dejar en segundo plano) y se anota el resultado
  // en el propio contacto, para que un fallo de Resend sea visible en el panel.
  const result = await sendLeadNotification(lead).catch((e) => ({ status: 'failed' as const, error: String(e) }))
  if (result.status !== 'sent') console.error('[leads] Aviso por email', result.status, '-', result.error)
  await updateLead(lead.id, { notifyStatus: result.status, notifyError: result.error?.slice(0, 300) ?? null }).catch((e) =>
    console.error('[leads] No se pudo anotar el resultado del aviso:', e)
  )

  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized()
  try {
    const body = await request.json()
    const id = clip(body.id, 80)
    if (!id) return NextResponse.json({ error: 'ID no válido' }, { status: 400 })

    const patch: LeadPatch = {}
    if (body.status !== undefined) {
      if (!isLeadStatus(String(body.status))) return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
      patch.status = body.status
    }
    if (body.priority !== undefined) {
      if (!isLeadPriority(String(body.priority))) return NextResponse.json({ error: 'Prioridad no válida' }, { status: 400 })
      patch.priority = body.priority
    }
    if (body.notes !== undefined) patch.notes = clip(body.notes, 4000) || null
    if (body.assignedTo !== undefined) patch.assignedTo = clip(body.assignedTo, 80) || null
    if (body.lastContactAt) patch.lastContactAt = new Date(body.lastContactAt).toISOString()

    const updated = await updateLead(id, patch)
    if (!updated) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar el contacto' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized()
  try {
    const id = clip((await request.json())?.id, 80)
    if (!id) return NextResponse.json({ error: 'ID no válido' }, { status: 400 })
    if (!(await deleteLead(id))) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar el contacto' }, { status: 500 })
  }
}
