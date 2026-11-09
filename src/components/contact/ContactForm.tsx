'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

const INTENTS = [
  { value: 'comprar', label: 'Quiero comprar' },
  { value: 'vender', label: 'Quiero vender' },
  { value: 'alquilar', label: 'Quiero alquilar' },
  { value: 'otro', label: 'Otra consulta' },
]

export function ContactForm() {
  const params = useSearchParams()
  const ref = (params.get('ref') || '').slice(0, 60)

  const initial = {
    nombre: '',
    email: '',
    telefono: '',
    intent: 'comprar',
    mensaje: ref ? `Hola, me interesa el inmueble con referencia ${ref}. ` : '',
    privacidad: false,
    website: '', // campo trampa anti-bots
  }
  const [form, setForm] = useState(initial)
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setState('sending')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.nombre,
          email: form.email,
          phone: form.telefono,
          notes: form.mensaje,
          intent: form.intent,
          propertyRef: ref || undefined,
          source: 'web_contacto',
          website: form.website,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || 'No se pudo enviar el mensaje')
      }
      setState('sent')
    } catch (err) {
      setState('idle')
      setError(err instanceof Error ? err.message : 'No se pudo enviar el mensaje. Inténtalo de nuevo en unos minutos.')
    }
  }

  if (state === 'sent') {
    return (
      <div className="rounded-2xl border border-brand-green/30 bg-brand-green-tint p-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-green text-2xl text-white">✓</span>
        <h3 className="mt-4 text-2xl text-brand-green-dark">Mensaje enviado</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-stone-600">Gracias por escribirnos. Nos pondremos en contacto contigo lo antes posible.</p>
        <button type="button" onClick={() => { setForm(initial); setState('idle') }} className="mt-6 text-sm font-medium text-brand-green underline">
          Enviar otro mensaje
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
      <h2 className="text-2xl text-stone-900">Envíanos un mensaje</h2>

      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Web
          <input name="website" value={form.website} onChange={change} tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="c-nombre">Nombre *</label>
          <input id="c-nombre" name="nombre" value={form.nombre} onChange={change} required className="field" placeholder="Tu nombre" autoComplete="name" />
        </div>
        <div>
          <label className="field-label" htmlFor="c-tel">Teléfono *</label>
          <input id="c-tel" name="telefono" value={form.telefono} onChange={change} required inputMode="tel" className="field" placeholder="600 000 000" autoComplete="tel" />
        </div>
        <div>
          <label className="field-label" htmlFor="c-email">Email</label>
          <input id="c-email" name="email" type="email" value={form.email} onChange={change} className="field" placeholder="tu@email.com" autoComplete="email" />
        </div>
        <div>
          <label className="field-label" htmlFor="c-intent">¿En qué podemos ayudarte?</label>
          <select id="c-intent" name="intent" value={form.intent} onChange={change} className="field">
            {INTENTS.map((i) => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="c-msg">Mensaje *</label>
        <textarea id="c-msg" name="mensaje" value={form.mensaje} onChange={change} required rows={5} className="field resize-none" placeholder="Cuéntanos qué necesitas…" />
      </div>

      <label className="flex items-start gap-3 text-sm text-stone-600">
        <input type="checkbox" name="privacidad" checked={form.privacidad} onChange={change} required className="mt-1 h-4 w-4 accent-brand-green" />
        <span>
          He leído y acepto la{' '}
          <Link href="/politica-privacidad" className="font-medium text-brand-green underline">política de privacidad</Link>.
        </span>
      </label>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button type="submit" disabled={state === 'sending'} className="btn-primary w-full py-4 text-base disabled:cursor-not-allowed disabled:opacity-60">
        {state === 'sending' ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </form>
  )
}
