'use client'

import { useEffect, useMemo, useState } from 'react'
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard'
import { MailIcon, PhoneIcon, WhatsAppIcon } from '@/components/brand/Icons'
import {
  LEAD_INTENT_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
} from '@/lib/leads'
import { cn } from '@/lib/utils'
import type { Lead, LeadSource, LeadStatus } from '@/types'

type SourceFilter = 'all' | LeadSource
type StatusFilter = 'all' | LeadStatus

const dateFmt = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' })

function isToday(date: Date) {
  const now = new Date()
  return date.toDateString() === now.toDateString()
}

function timeAgo(date: Date) {
  const minutes = Math.round((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return 'ahora mismo'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  return `hace ${days} ${days === 1 ? 'día' : 'días'}`
}

const STATUS_STYLES: Record<LeadStatus, string> = {
  nuevo: 'bg-brand-yellow text-brand-green-deep',
  contactado: 'bg-sky-100 text-sky-800',
  visita_agendada: 'bg-violet-100 text-violet-800',
  visita_realizada: 'bg-indigo-100 text-indigo-800',
  oferta: 'bg-amber-100 text-amber-800',
  reserva: 'bg-orange-100 text-orange-800',
  cerrado: 'bg-brand-green-tint text-brand-green-dark',
  descartado: 'bg-stone-200 text-stone-600',
}

function leadDetails(lead: Lead): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = []
  if (lead.propertyRef) rows.push({ label: 'Inmueble', value: lead.propertyRef })
  if (lead.saleTimeline) rows.push({ label: 'Plazo', value: lead.saleTimeline })
  if (lead.notes) {
    const lines = lead.notes.split('\n')
    const structured = lines.every((l) => /^[^:]{2,30}: /.test(l))
    if (structured) {
      for (const line of lines) {
        const idx = line.indexOf(':')
        rows.push({ label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() })
      }
    } else {
      rows.push({ label: 'Mensaje', value: lead.notes })
    }
  }
  return rows
}

const reviveLead = (lead: Lead): Lead => ({
  ...lead,
  createdAt: new Date(lead.createdAt),
  updatedAt: new Date(lead.updatedAt),
  firstResponseAt: lead.firstResponseAt ? new Date(lead.firstResponseAt) : null,
  lastContactAt: lead.lastContactAt ? new Date(lead.lastContactAt) : null,
})

export default function AdminLeadsPage() {
  return (
    <AdminAuthGuard>
      <AdminLeadsPanel />
    </AdminAuthGuard>
  )
}

function AdminLeadsPanel() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [deleting, setDeleting] = useState<Lead | null>(null)

  const fetchLeads = async () => {
    setError('')
    try {
      const res = await fetch('/api/leads', { credentials: 'include' })
      const data = await res.json().catch(() => [])
      if (!res.ok) throw new Error()
      setLeads((data as Lead[]).map(reviveLead))
    } catch {
      setError('No se pudieron cargar los contactos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const updateStatus = async (id: string, status: LeadStatus) => {
    const res = await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id, status, ...(status === 'contactado' ? { lastContactAt: new Date().toISOString() } : {}) }),
    })
    if (!res.ok) {
      setError('No se pudo actualizar el estado')
      return
    }
    const updated = reviveLead((await res.json()) as Lead)
    setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)))
  }

  const confirmDelete = async () => {
    if (!deleting) return
    const res = await fetch('/api/leads', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: deleting.id }),
    })
    if (res.ok) setLeads((prev) => prev.filter((l) => l.id !== deleting.id))
    else setError('No se pudo eliminar el contacto')
    setDeleting(null)
  }

  const stats = useMemo(
    () => ({
      total: leads.length,
      today: leads.filter((l) => isToday(l.createdAt)).length,
      pending: leads.filter((l) => l.status === 'nuevo').length,
      closed: leads.filter((l) => l.status === 'cerrado').length,
    }),
    [leads]
  )

  const visible = leads
    .filter((l) => sourceFilter === 'all' || l.source === sourceFilter)
    .filter((l) => statusFilter === 'all' || l.status === statusFilter)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl text-stone-900">Contactos</h1>
        <p className="mt-1 text-sm text-stone-500">Mensajes y solicitudes de valoración recibidos desde la web.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl bg-brand-green p-5 text-white shadow-sm">
          <p className="font-display text-4xl font-semibold leading-none">{stats.pending}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] opacity-85">Sin atender</p>
        </div>
        <div className="rounded-xl bg-brand-yellow p-5 text-brand-green-deep shadow-sm">
          <p className="font-display text-4xl font-semibold leading-none">{stats.today}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] opacity-85">Recibidos hoy</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="font-display text-4xl font-semibold leading-none text-stone-900">{stats.total}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-stone-500">Total</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="font-display text-4xl font-semibold leading-none text-stone-900">{stats.closed}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-stone-500">Cerrados</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="field-label" htmlFor="l-source">Origen</label>
          <select id="l-source" className="field py-2" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}>
            <option value="all">Todos</option>
            {(Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]).map((s) => (
              <option key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="l-status">Estado</label>
          <select id="l-status" className="field py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
            <option value="all">Todos</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <p className="pb-2 text-sm text-stone-500">{visible.length} resultado{visible.length !== 1 ? 's' : ''}</p>
      </div>

      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {leads.some((l) => l.notifyStatus === 'failed') && (
        <p role="status" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <strong>Hay avisos por email que no se pudieron enviar.</strong> Los contactos están guardados aquí, pero revisa la
          configuración de Resend (clave, remitente y dominio verificado): pasa el ratón por la etiqueta roja para ver el motivo.
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton h-32 w-full rounded-xl" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white py-16 text-center text-stone-500">
          No hay contactos con esos filtros.
        </div>
      ) : (
        <ul className="space-y-4">
          {visible.map((lead) => {
            const details = leadDetails(lead)
            const waNumber = lead.phone.replace(/\D/g, '')
            const canWhatsApp = waNumber.length >= 9
            return (
              <li key={lead.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl font-semibold text-stone-900">{lead.fullName}</h2>
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_STYLES[lead.status])}>{LEAD_STATUS_LABELS[lead.status]}</span>
                      {lead.demo && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">Ejemplo</span>}
                      {lead.status === 'nuevo' && Date.now() - lead.createdAt.getTime() > 24 * 3600 * 1000 && (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">Sin atender +24 h</span>
                      )}
                      {lead.notifyStatus === 'sent' && <span className="rounded bg-brand-green-tint px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-green-dark" title="El aviso por email llegó al equipo">Aviso enviado</span>}
                      {lead.notifyStatus === 'failed' && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700" title={lead.notifyError || 'El aviso por email falló'}>Aviso por email falló</span>}
                      {lead.notifyStatus === 'skipped' && <span className="rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-600" title={lead.notifyError || 'Resend no está configurado'}>Sin aviso por email</span>}
                    </div>
                    <p className="mt-1 text-xs text-stone-500" title={dateFmt.format(lead.createdAt)}>
                      {timeAgo(lead.createdAt)} · {LEAD_SOURCE_LABELS[lead.source]} · Quiere {LEAD_INTENT_LABELS[lead.intent].toLowerCase()}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                      <a href={`tel:${lead.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 rounded-md bg-brand-green-tint px-3 py-1.5 font-medium text-brand-green-dark hover:bg-brand-green hover:text-white">
                        <PhoneIcon className="h-4 w-4" /> {lead.phone}
                      </a>
                      {canWhatsApp && (
                        <a href={`https://wa.me/${waNumber.length === 9 ? `34${waNumber}` : waNumber}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md bg-brand-green-tint px-3 py-1.5 font-medium text-brand-green-dark hover:bg-brand-green hover:text-white">
                          <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                        </a>
                      )}
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 rounded-md bg-brand-green-tint px-3 py-1.5 font-medium text-brand-green-dark hover:bg-brand-green hover:text-white">
                          <MailIcon className="h-4 w-4" /> {lead.email}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 md:w-52">
                    <label className="field-label" htmlFor={`st-${lead.id}`}>Estado</label>
                    <select id={`st-${lead.id}`} className="field py-2" value={lead.status} onChange={(e) => updateStatus(lead.id, e.target.value as LeadStatus)}>
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setDeleting(lead)} className="self-start text-xs text-red-600 hover:text-red-800">
                      Eliminar contacto
                    </button>
                  </div>
                </div>

                {details.length > 0 && (
                  <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-1.5 border-t border-stone-100 pt-4 text-sm sm:grid-cols-2">
                    {details.map((row, i) => (
                      <div key={i} className={cn('flex gap-2', row.label === 'Mensaje' && 'sm:col-span-2')}>
                        <dt className="shrink-0 text-stone-500">{row.label}:</dt>
                        <dd className="whitespace-pre-line text-stone-800">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-green-deep/60 px-6" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && setDeleting(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-7 shadow-2xl">
            <h3 className="mb-2 text-xl text-stone-900">¿Eliminar este contacto?</h3>
            <p className="mb-6 text-sm text-stone-500">Se borrará «{deleting.fullName}» de la lista. Esta acción no se puede deshacer.</p>
            <div className="flex items-center gap-4">
              <button type="button" onClick={confirmDelete} className="inline-flex items-center justify-center rounded-md bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700">Eliminar</button>
              <button type="button" onClick={() => setDeleting(null)} className="text-sm text-stone-500 hover:text-stone-900">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
