import { AGENT, CONTACT } from '@/lib/contact'
import { LEAD_INTENT_LABELS, LEAD_SOURCE_LABELS } from '@/lib/leads'
import type { Lead, NotifyStatus } from '@/types'

/**
 * Aviso por email al equipo cuando entra un contacto nuevo (Resend, por API REST, sin SDK).
 *
 * Variables (se definen en .env.local o en Vercel; nunca en el código):
 *   RESEND_API_KEY            clave de API de Resend. Sin ella no se envía nada (queda "no configurado").
 *   RESEND_FROM_EMAIL         remitente, p. ej. «ILLAN Inmobiliaria <avisos@tudominio.com>» (dominio verificado en Resend).
 *                             Sin dominio verificado: «… <onboarding@resend.dev>», que solo entrega al titular de la cuenta de Resend.
 *   LEADS_NOTIFICATION_EMAIL  destinatario(s), separados por comas. Por defecto, el correo de contacto de la web.
 *
 * El resultado se guarda en el propio contacto (notifyStatus) para que un fallo NO pase desapercibido en el panel.
 */

export type NotifyResult = { status: NotifyStatus; error?: string }

const BRAND_GREEN = '#1B8036'
const BRAND_DEEP = '#0D4720'
const BRAND_YELLOW = '#E8DC2D'

const esc = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/+$/, '')
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  return vercel ? `https://${vercel}` : 'https://www.inmobiliariaillan.com'
}

function recipients(): string[] {
  return (process.env.LEADS_NOTIFICATION_EMAIL?.trim() || CONTACT.email)
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
}

function headline(lead: Lead): { subject: string; title: string } {
  switch (lead.source) {
    case 'web_valoracion':
      return { subject: `Nueva valoración gratuita — ${lead.fullName}`, title: 'Nueva valoración gratuita solicitada' }
    case 'web_contacto':
      return { subject: `Nuevo contacto — ${lead.fullName}`, title: 'Nuevo contacto desde la web' }
    default:
      return { subject: `Nuevo aviso — ${lead.fullName}`, title: 'Nuevo aviso en la web' }
  }
}

function rows(lead: Lead): { label: string; value: string; href?: string; multiline?: boolean }[] {
  const out: { label: string; value: string; href?: string; multiline?: boolean }[] = [
    { label: 'Nombre', value: lead.fullName },
    { label: 'Teléfono', value: lead.phone, href: `tel:${lead.phone.replace(/[^\d+]/g, '')}` },
  ]
  if (lead.email) out.push({ label: 'Email', value: lead.email, href: `mailto:${lead.email}` })
  out.push({ label: 'Origen', value: LEAD_SOURCE_LABELS[lead.source] ?? lead.source })
  out.push({ label: 'Quiere', value: LEAD_INTENT_LABELS[lead.intent] ?? lead.intent })
  if (lead.propertyRef) out.push({ label: 'Inmueble', value: lead.propertyRef })
  if (lead.saleTimeline) out.push({ label: 'Plazo', value: lead.saleTimeline })
  if (lead.notes) out.push({ label: 'Mensaje', value: lead.notes, multiline: true })
  return out
}

function buildHtml(lead: Lead, title: string): string {
  const panel = `${siteUrl()}/admin/leads`
  const body = rows(lead)
    .map(
      (r) => `<tr>
        <td style="padding:8px 14px 8px 0;vertical-align:top;font-size:13px;font-weight:600;color:#57534e;white-space:nowrap">${esc(r.label)}</td>
        <td style="padding:8px 0;vertical-align:top;font-size:15px;color:#1c1917;${r.multiline ? 'white-space:pre-wrap;' : ''}">${
          r.href ? `<a href="${esc(r.href)}" style="color:${BRAND_GREEN};text-decoration:none;font-weight:600">${esc(r.value)}</a>` : esc(r.value)
        }</td></tr>`
    )
    .join('')

  return `<!doctype html><html><body style="margin:0;background:#f5f5f4;padding:24px 12px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e7e5e4">
    <tr><td style="background:${BRAND_GREEN};padding:20px 24px;border-bottom:4px solid ${BRAND_YELLOW}">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:${BRAND_YELLOW};letter-spacing:1px">ILLAN</div>
      <div style="font-size:12px;color:#ffffff;opacity:.85;letter-spacing:.12em;text-transform:uppercase">Inmobiliaria · Lugo</div>
    </td></tr>
    <tr><td style="padding:24px">
      <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:${BRAND_DEEP}">${esc(title)}</h1>
      <table role="presentation" width="100%" style="border-collapse:collapse">${body}</table>
      <p style="margin:24px 0 0"><a href="${esc(panel)}" style="display:inline-block;background:${BRAND_GREEN};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:8px">Abrir en el panel</a></p>
      <p style="margin:20px 0 0;font-size:12px;color:#a8a29e">Responde a este correo para escribir directamente al cliente${lead.email ? '' : ' (no dejó email: llámale al teléfono)'}.</p>
    </td></tr>
  </table></body></html>`
}

function buildText(lead: Lead, title: string): string {
  return [title, '', ...rows(lead).map((r) => `${r.label}: ${r.value}`), '', `Panel: ${siteUrl()}/admin/leads`].join('\n')
}

export async function sendLeadNotification(lead: Lead): Promise<NotifyResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { status: 'skipped', error: 'RESEND_API_KEY no configurada' }

  const to = recipients()
  if (to.length === 0) return { status: 'skipped', error: 'Sin destinatario' }

  const from = process.env.RESEND_FROM_EMAIL?.trim() || `${AGENT.name} <onboarding@resend.dev>`
  const { subject, title } = headline(lead)
  const payload: Record<string, unknown> = {
    from,
    to,
    subject,
    html: buildHtml(lead, title),
    text: buildText(lead, title),
  }
  if (lead.email) payload.reply_to = lead.email

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    if (!res.ok) {
      const detail = (await res.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 240)
      return { status: 'failed', error: `Resend ${res.status}: ${detail}` }
    }
    return { status: 'sent' }
  } catch (error) {
    const reason = error instanceof Error && error.name === 'AbortError' ? 'tiempo de espera agotado' : String(error)
    return { status: 'failed', error: `No se pudo contactar con Resend: ${reason}` }
  } finally {
    clearTimeout(timer)
  }
}
