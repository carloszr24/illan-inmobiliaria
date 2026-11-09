'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BEDROOM_FILTER_OPTIONS, cn, OPERATION_LABELS, PROPERTY_OPERATIONS, PROPERTY_TYPES, TYPE_LABELS } from '@/lib/utils'

const PRICE_STEPS_SALE = [50000, 100000, 150000, 200000, 300000, 500000]
const PRICE_STEPS_RENT = [400, 500, 600, 800, 1000, 1500]

const fmt = (n: number) => new Intl.NumberFormat('es-ES').format(n)

export function PropertyFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const operation = params.get('operation') || ''
  const [q, setQ] = useState(params.get('q') || '')

  useEffect(() => setQ(params.get('q') || ''), [params])

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params.toString())
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    // Si cambia la operación, el precio máximo anterior deja de tener sentido
    if ('operation' in patch) next.delete('maxPrice')
    const query = next.toString()
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const steps = operation === 'alquiler' ? PRICE_STEPS_RENT : PRICE_STEPS_SALE
  // "vista" (lista/mapa) no es un filtro: se conserva al limpiar
  const vista = params.get('vista')
  const hasFilters = Array.from(params.keys()).some((key) => key !== 'vista')

  return (
    <section aria-label="Filtros" className="border-b border-stone-200 bg-brand-green-tint/60">
      <div className="mx-auto max-w-7xl px-6 py-6 md:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          {/* Operación */}
          <div role="group" aria-label="Operación" className="inline-flex shrink-0 overflow-hidden rounded-md border border-brand-green/30 bg-white">
            {[{ value: '', label: 'Todas' }, ...PROPERTY_OPERATIONS.map((o) => ({ value: o, label: OPERATION_LABELS[o] }))].map((o) => (
              <button
                key={o.value || 'all'}
                type="button"
                onClick={() => update({ operation: o.value })}
                aria-pressed={operation === o.value}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium transition-colors',
                  operation === o.value ? 'bg-brand-green text-white' : 'text-stone-600 hover:bg-brand-green-tint'
                )}
              >
                {o.label}
              </button>
            ))}
          </div>

          <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <label className="field-label" htmlFor="f-type">Tipo</label>
              <select id="f-type" className="field py-2.5" value={params.get('type') || ''} onChange={(e) => update({ type: e.target.value })}>
                <option value="">Todos</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="f-beds">Habitaciones</label>
              <select id="f-beds" className="field py-2.5" value={params.get('bedrooms') || ''} onChange={(e) => update({ bedrooms: e.target.value })}>
                <option value="">Cualquiera</option>
                {BEDROOM_FILTER_OPTIONS.map((b) => (
                  <option key={b} value={b}>{b === '4' ? '4 o más' : b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="f-price">Precio máximo</label>
              <select id="f-price" className="field py-2.5" value={params.get('maxPrice') || ''} onChange={(e) => update({ maxPrice: e.target.value })}>
                <option value="">Sin límite</option>
                {steps.map((s) => (
                  <option key={s} value={s}>{fmt(s)} €{operation === 'alquiler' ? '/mes' : ''}</option>
                ))}
              </select>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                update({ q: q.trim() })
              }}
            >
              <label className="field-label" htmlFor="f-q">Buscar</label>
              <input id="f-q" className="field py-2.5" placeholder="Zona, referencia…" value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => q.trim() !== (params.get('q') || '') && update({ q: q.trim() })} />
            </form>
          </div>

          {hasFilters && (
            <button type="button" onClick={() => router.push(vista ? `${pathname}?vista=${encodeURIComponent(vista)}` : pathname, { scroll: false })} className="shrink-0 pb-3 text-sm font-medium text-brand-green underline-offset-4 hover:underline">
              Limpiar filtros
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
