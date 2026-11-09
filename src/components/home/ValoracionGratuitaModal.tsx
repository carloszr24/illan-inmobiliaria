'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CONTACT, phoneHref } from '@/lib/contact'
import { cn, PROPERTY_TYPES, TYPE_LABELS } from '@/lib/utils'

const TIMELINES = ['Lo antes posible', 'En 1-3 meses', 'En 3-6 meses', 'Solo quiero saber cuánto vale']

type Props = {
  triggerLabel: string
  triggerClassName?: string
}

const empty = {
  nombre: '',
  telefono: '',
  email: '',
  tipo: 'piso',
  zona: '',
  metros: '',
  plazo: TIMELINES[0],
  comentarios: '',
  website: '', // campo trampa anti-bots
}

export function ValoracionGratuitaModal({ triggerLabel, triggerClassName }: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [form, setForm] = useState(empty)
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open])

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const close = () => {
    setOpen(false)
    if (state === 'sent') {
      setState('idle')
      setForm(empty)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setState('sending')
    try {
      const notes = [
        `Tipo de inmueble: ${TYPE_LABELS[form.tipo] || form.tipo}`,
        form.zona && `Zona: ${form.zona}`,
        form.metros && `Superficie: ${form.metros} m²`,
        form.comentarios && `Comentarios: ${form.comentarios}`,
      ]
        .filter(Boolean)
        .join('\n')
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.nombre,
          phone: form.telefono,
          email: form.email,
          notes,
          saleTimeline: form.plazo,
          source: 'web_valoracion',
          intent: 'vender',
          website: form.website,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || 'No se pudo enviar la solicitud')
      }
      setState('sent')
    } catch (err) {
      setState('idle')
      setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud')
    }
  }

  const modal = open && (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-brand-green-deep/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="valoracion-title"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className="relative max-h-[95dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-xl leading-none text-stone-600 shadow hover:bg-white"
        >
          ×
        </button>

        <div className="bg-gradient-to-br from-brand-green-deep to-brand-green px-6 py-6 pr-14 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-yellow">Sin compromiso</p>
          <h2 id="valoracion-title" className="mt-1 text-2xl">
            Valoración gratuita de tu inmueble
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/85">
            Cuéntanos qué quieres vender y te llamamos para darte una orientación realista del precio de mercado en Lugo.
          </p>
        </div>

        {state === 'sent' ? (
          <div className="px-6 py-10 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-green-tint text-2xl text-brand-green">
              ✓
            </span>
            <h3 className="mt-4 text-xl text-stone-900">¡Solicitud recibida!</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-stone-600">
              Nos pondremos en contacto contigo lo antes posible. Si es urgente, llámanos al{' '}
              <a href={phoneHref} className="font-medium text-brand-green underline">
                {CONTACT.phone.display}
              </a>
              .
            </p>
            <button type="button" onClick={close} className="btn-primary mt-6">
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 px-6 py-6">
            {/* Campo trampa: invisible para personas */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <label>
                Web
                <input name="website" value={form.website} onChange={change} tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="v-nombre">Nombre *</label>
                <input id="v-nombre" name="nombre" value={form.nombre} onChange={change} required className="field" autoComplete="name" />
              </div>
              <div>
                <label className="field-label" htmlFor="v-telefono">Teléfono *</label>
                <input id="v-telefono" name="telefono" value={form.telefono} onChange={change} required inputMode="tel" className="field" autoComplete="tel" />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="v-email">Email (opcional)</label>
                <input id="v-email" name="email" type="email" value={form.email} onChange={change} className="field" autoComplete="email" />
              </div>
              <div>
                <label className="field-label" htmlFor="v-tipo">Tipo de inmueble</label>
                <select id="v-tipo" name="tipo" value={form.tipo} onChange={change} className="field">
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="v-zona">Zona</label>
                <input id="v-zona" name="zona" value={form.zona} onChange={change} placeholder="Ej: Fingoi, Lugo" className="field" />
              </div>
              <div>
                <label className="field-label" htmlFor="v-metros">Superficie aprox. (m²)</label>
                <input id="v-metros" name="metros" type="number" min="0" value={form.metros} onChange={change} className="field" />
              </div>
              <div>
                <label className="field-label" htmlFor="v-plazo">¿Para cuándo?</label>
                <select id="v-plazo" name="plazo" value={form.plazo} onChange={change} className="field">
                  {TIMELINES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="v-com">Comentarios</label>
                <textarea id="v-com" name="comentarios" value={form.comentarios} onChange={change} rows={3} className="field resize-none" />
              </div>
            </div>

            {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
              <button type="button" onClick={close} className="px-4 py-3 text-sm text-stone-500 hover:text-stone-900">
                Cancelar
              </button>
              <button type="submit" disabled={state === 'sending'} className="btn-primary disabled:opacity-60">
                {state === 'sending' ? 'Enviando…' : 'Solicitar valoración'}
              </button>
            </div>
            <p className="text-center text-[11px] text-stone-400">
              Al enviar aceptas la <a href="/politica-privacidad" className="underline">política de privacidad</a>.
            </p>
          </form>
        )}
      </div>
    </div>
  )

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn(triggerClassName)}>
        {triggerLabel}
      </button>
      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  )
}
