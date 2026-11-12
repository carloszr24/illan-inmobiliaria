'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard'
import { ExtrasDropdown } from '@/components/admin/ExtrasDropdown'
import { LocationPicker } from '@/components/admin/LocationPicker'
import { getPropertyExtras, type PropertyExtraId } from '@/lib/property-extras'
import type { Property } from '@/types'
import {
  cn,
  DEFAULT_PROVINCE,
  formatPrice,
  MAX_FEATURED_ON_HOME,
  MAX_PROPERTY_IMAGES,
  OPERATION_LABELS,
  parseImages,
  PROPERTY_OPERATIONS,
  PROPERTY_PROVINCES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  STATUS_BADGE_CLASSES_ADMIN,
  STATUS_LABELS,
  TYPE_LABELS,
} from '@/lib/utils'

type ImageItem =
  | { id: string; kind: 'existing'; url: string }
  | { id: string; kind: 'new'; file: File; previewUrl: string }

const emptyForm = {
  title: '',
  price: '',
  location: '',
  province: DEFAULT_PROVINCE as string,
  type: 'piso',
  operation: 'venta',
  status: 'disponible',
  description: '',
  portalUrl: '',
  bedrooms: '',
  bathrooms: '',
  sqMeters: '',
  availability: '',
  hotWater: '',
  heating: '',
  condition: '',
  propertyAge: '',
  floor: '',
  extras: [] as PropertyExtraId[],
  energyRating: '',
  energyValue: '',
  emissionsRating: '',
  emissionsValue: '',
  lat: '',
  lon: '',
  ownerName: '',
  ownerPhone: '',
  featured: false,
}

type FormState = typeof emptyForm

const normalizeProperty = (p: Property): Property => ({
  ...p,
  createdAt: new Date(p.createdAt as unknown as string),
  updatedAt: new Date(p.updatedAt as unknown as string),
})

export default function AdminPage() {
  return <AdminAuthGuard>{({ logout }) => <AdminPropertiesPanel logout={logout} />}</AdminAuthGuard>
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  )
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: 'green' | 'yellow' | 'stone' | 'amber' }) {
  const tones = {
    green: 'bg-brand-green text-white',
    yellow: 'bg-brand-yellow text-brand-green-deep',
    stone: 'bg-white text-stone-900 border border-stone-200',
    amber: 'bg-white text-stone-900 border border-stone-200',
  }
  return (
    <div className={cn('rounded-xl p-5 shadow-sm', tones[tone])}>
      <p className="font-display text-4xl font-semibold leading-none">{value}</p>
      <p className={cn('mt-2 text-xs font-medium uppercase tracking-[0.14em]', tone === 'stone' || tone === 'amber' ? 'text-stone-500' : 'opacity-85')}>{label}</p>
    </div>
  )
}

function AdminPropertiesPanel({ logout }: { logout: () => Promise<void> }) {
  const [properties, setProperties] = useState<Property[]>([])
  const [visibility, setVisibility] = useState<'active' | 'archived' | 'all'>('active')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [imageItems, setImageItems] = useState<ImageItem[]>([])
  const [initialImageUrls, setInitialImageUrls] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<{ id: string; action: 'archive' | 'restore' | 'delete' } | null>(null)
  const [featuredCapError, setFeaturedCapError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [reordering, setReordering] = useState(false)

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/propiedades', { credentials: 'include' })
      const data = await res.json().catch(() => [])
      if (res.ok && Array.isArray(data)) setProperties((data as Property[]).map(normalizeProperty))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [])

  const sorted = useMemo(
    () =>
      [...properties].sort((a, b) => {
        const diff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
        return diff !== 0 ? diff : b.createdAt.getTime() - a.createdAt.getTime()
      }),
    [properties]
  )

  const stats = useMemo(
    () => ({
      published: properties.filter((p) => !p.archived).length,
      featured: properties.filter((p) => p.featured && !p.archived).length,
      reserved: properties.filter((p) => p.status === 'reservado' && !p.archived).length,
      archived: properties.filter((p) => p.archived).length,
    }),
    [properties]
  )

  const visible = sorted
    .filter((p) => (visibility === 'active' ? !p.archived : visibility === 'archived' ? p.archived : true))
    .filter((p) => {
      const needle = search.trim().toLowerCase()
      return !needle || `${p.title} ${p.location} ${p.ref ?? ''} ${p.ownerName ?? ''} ${p.ownerPhone ?? ''}`.toLowerCase().includes(needle)
    })

  const canReorder = visibility === 'active' && !search.trim()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      if (name === 'featured') {
        if (checked) {
          const selfFeatured = editingId ? properties.some((p) => p.id === editingId && p.featured) : false
          if (!selfFeatured && stats.featured >= MAX_FEATURED_ON_HOME) {
            setFeaturedCapError(`Solo puedes tener ${MAX_FEATURED_ON_HOME} destacadas en la home. Quita la marca en otra propiedad primero.`)
            return
          }
        }
        setFeaturedCapError(null)
      }
      setForm((f) => ({ ...f, [name]: checked }))
    } else {
      setForm((f) => ({ ...f, [name]: value }))
    }
  }

  const resetEditor = () => {
    imageItems.forEach((i) => i.kind === 'new' && URL.revokeObjectURL(i.previewUrl))
    setShowForm(false)
    setEditingId(null)
    setImageItems([])
    setImageError(null)
  }

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setImageItems([])
    setInitialImageUrls([])
    setFeaturedCapError(null)
    setSubmitError(null)
    setImageError(null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openEdit = (p: Property) => {
    const urls = parseImages(p.images)
    setForm({
      title: p.title,
      price: p.price.toString(),
      location: p.location,
      province: p.province || DEFAULT_PROVINCE,
      type: p.type,
      operation: p.operation || 'venta',
      status: p.status,
      description: p.description,
      portalUrl: p.portalUrl || '',
      bedrooms: p.bedrooms?.toString() || '',
      bathrooms: p.bathrooms?.toString() || '',
      sqMeters: p.sqMeters?.toString() || '',
      availability: p.availability || '',
      hotWater: p.hotWater || '',
      heating: p.heating && !['sí', 'si', 's'].includes(p.heating.trim().toLowerCase()) ? p.heating : '',
      condition: p.condition || '',
      propertyAge: p.propertyAge || '',
      floor: p.floor || '',
      extras: getPropertyExtras(p),
      energyRating: p.energyRating || '',
      energyValue: p.energyValue?.toString() || '',
      emissionsRating: p.emissionsRating || '',
      emissionsValue: p.emissionsValue?.toString() || '',
      lat: p.lat != null ? String(p.lat) : '',
      lon: p.lon != null ? String(p.lon) : '',
      ownerName: p.ownerName || '',
      ownerPhone: p.ownerPhone || '',
      featured: p.featured,
    })
    setEditingId(p.id)
    setInitialImageUrls(urls)
    setImageItems(urls.map((url) => ({ id: crypto.randomUUID(), kind: 'existing', url })))
    setFeaturedCapError(null)
    setSubmitError(null)
    setImageError(null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp'])
    const next: ImageItem[] = []
    const rejected: string[] = []
    for (const f of Array.from(files)) {
      if (!allowed.has(f.type)) rejected.push(`${f.name}: formato no admitido (usa JPG, PNG o WebP)`)
      else if (f.size > 5 * 1024 * 1024) rejected.push(`${f.name}: pesa más de 5 MB`)
      else next.push({ id: crypto.randomUUID(), kind: 'new', file: f, previewUrl: URL.createObjectURL(f) })
    }
    setImageError(rejected.length ? rejected.join(' · ') : null)
    if (next.length) setImageItems((prev) => [...prev, ...next].slice(0, MAX_PROPERTY_IMAGES))
  }

  const removeItem = (id: string) => {
    const item = imageItems.find((x) => x.id === id)
    if (item?.kind === 'new') URL.revokeObjectURL(item.previewUrl)
    setImageItems((prev) => prev.filter((x) => x.id !== id))
  }

  const moveItem = (from: number, to: number) =>
    setImageItems((prev) => {
      const next = [...prev]
      const [it] = next.splice(from, 1)
      next.splice(to, 0, it)
      return next
    })

  const uploadNewImages = async (propertyId: string) => {
    const results: { id: string; url: string }[] = []
    for (const item of imageItems) {
      if (item.kind !== 'new') continue
      const fd = new FormData()
      fd.append('file', item.file)
      const res = await fetch(`/api/uploads/property-image?propertyId=${encodeURIComponent(propertyId)}`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      if (!res.ok) throw new Error('Error al subir imagen')
      results.push({ id: item.id, url: ((await res.json()) as { url: string }).url })
    }
    return results
  }

  const deleteRemovedImages = async (finalUrls: string[]) => {
    for (const url of initialImageUrls.filter((u) => !finalUrls.includes(u))) {
      if (!url.startsWith('/media/')) continue // solo se borran las fotos subidas desde el panel
      await fetch('/api/uploads/property-image', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
    }
  }

  const finalImageUrls = (uploaded: { id: string; url: string }[]) =>
    imageItems
      .map((it) => (it.kind === 'existing' ? it.url : uploaded.find((u) => u.id === it.id)?.url || ''))
      .filter(Boolean)

  const save = async (propertyId: string, images: string[]) => {
    const res = await fetch(`/api/propiedades/${propertyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...form, images }),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(body.error || 'Error al guardar la propiedad')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (imageItems.length === 0 && !window.confirm('No has añadido ninguna foto. La propiedad se publicará sin imágenes. ¿Continuar?')) return
    setSaving(true)
    setSubmitError(null)
    let stage: 'data' | 'images' = 'data'
    try {
      let propertyId = editingId
      if (!propertyId) {
        const existing = imageItems.filter((i): i is Extract<ImageItem, { kind: 'existing' }> => i.kind === 'existing').map((i) => i.url)
        const res = await fetch('/api/propiedades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...form, images: existing }),
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(body.error || 'Error al crear la propiedad')
        }
        propertyId = ((await res.json()) as { id: string }).id
      }

      stage = 'images'
      const uploaded = await uploadNewImages(propertyId)
      const urls = finalImageUrls(uploaded)
      stage = 'data'
      await save(propertyId, urls)
      if (editingId) await deleteRemovedImages(urls)

      resetEditor()
      await fetchProperties()
    } catch (err) {
      setSubmitError(
        stage === 'images'
          ? 'La propiedad se guardó, pero falló la subida de alguna imagen. Ábrela con "Editar" para volver a intentarlo.'
          : err instanceof Error
            ? err.message
            : 'No se pudo guardar'
      )
    } finally {
      setSaving(false)
    }
  }

  const runConfirmed = async () => {
    if (!confirm) return
    const { id, action } = confirm
    if (action === 'delete') {
      await fetch(`/api/propiedades/${id}`, { method: 'DELETE', credentials: 'include' })
    } else {
      await fetch(`/api/propiedades/${id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ archived: action === 'archive' }),
      })
    }
    setConfirm(null)
    await fetchProperties()
  }

  const moveProperty = async (id: string, direction: 'up' | 'down') => {
    if (!canReorder) return
    const ordered = sorted.filter((p) => !p.archived)
    const index = ordered.findIndex((p) => p.id === id)
    const swap = direction === 'up' ? index - 1 : index + 1
    if (index < 0 || swap < 0 || swap >= ordered.length) return
    const next = [...ordered]
    ;[next[index], next[swap]] = [next[swap], next[index]]

    setReordering(true)
    try {
      const res = await fetch('/api/propiedades/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: next.map((p) => p.id) }),
      })
      if (res.ok) await fetchProperties()
    } finally {
      setReordering(false)
    }
  }

  const confirmTarget = confirm ? properties.find((p) => p.id === confirm.id) : null

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl text-stone-900">Propiedades</h1>
          <p className="mt-1 text-sm text-stone-500">Gestiona los inmuebles que se muestran en la web.</p>
        </div>
        <div className="flex items-center gap-4">
          <button type="button" onClick={logout} className="text-sm text-stone-500 transition-colors hover:text-stone-900">
            Cerrar sesión
          </button>
          <button type="button" onClick={openCreate} className="btn-primary px-5 py-2.5">
            + Nueva propiedad
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Publicadas" value={stats.published} tone="green" />
        <StatCard label={`Destacadas (máx. ${MAX_FEATURED_ON_HOME})`} value={stats.featured} tone="yellow" />
        <StatCard label="Reservadas" value={stats.reserved} tone="stone" />
        <StatCard label="Archivadas" value={stats.archived} tone="amber" />
      </div>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleSubmit} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 bg-brand-green px-6 py-4 text-white">
            <h2 className="text-xl text-white">{editingId ? 'Editar propiedad' : 'Nueva propiedad'}</h2>
            <button type="button" onClick={resetEditor} className="text-2xl leading-none text-white/80 hover:text-white" aria-label="Cerrar formulario">
              ×
            </button>
          </div>

          <div className="space-y-8 p-6 md:p-8">
            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-green">Datos principales</h3>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <Field label="Título *" className="md:col-span-3">
                  <input name="title" value={form.title} onChange={handleChange} required className="field" placeholder="Ej: Piso de 3 dormitorios en el centro de Lugo" />
                </Field>
                <Field label="Precio (€) *">
                  <input name="price" value={form.price} onChange={handleChange} required type="number" min="0" className="field" />
                </Field>
                <Field label="Operación">
                  <select name="operation" value={form.operation} onChange={handleChange} className="field">
                    {PROPERTY_OPERATIONS.map((op) => (
                      <option key={op} value={op}>{OPERATION_LABELS[op]}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Tipo">
                  <select name="type" value={form.type} onChange={handleChange} className="field">
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Ubicación *" className="md:col-span-2">
                  <input name="location" value={form.location} onChange={handleChange} required className="field" placeholder="Ej: Garabolos, Lugo" />
                </Field>
                <Field label="Provincia">
                  <select name="province" value={form.province} onChange={handleChange} className="field">
                    {PROPERTY_PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Estado">
                  <select name="status" value={form.status} onChange={handleChange} className="field">
                    {PROPERTY_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Superficie (m²)">
                  <input name="sqMeters" value={form.sqMeters} onChange={handleChange} type="number" min="0" step="any" className="field" />
                </Field>
                <Field label="Habitaciones">
                  <input name="bedrooms" value={form.bedrooms} onChange={handleChange} type="number" min="0" className="field" />
                </Field>
                <Field label="Baños">
                  <input name="bathrooms" value={form.bathrooms} onChange={handleChange} type="number" min="0" className="field" />
                </Field>
                <Field label="Enlace a portal inmobiliario (opcional)" className="md:col-span-2">
                  <input name="portalUrl" value={form.portalUrl} onChange={handleChange} className="field" placeholder="Idealista, Fotocasa… (con o sin https://)" />
                </Field>
                <Field label="Descripción *" className="md:col-span-3">
                  <textarea name="description" value={form.description} onChange={handleChange} required rows={5} className="field resize-y" />
                </Field>
              </div>
            </section>

            <section>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-green">Propietario</h3>
              <p className="mb-4 text-xs text-stone-500">Datos internos: solo los ve la agencia en este panel. No se publican en la web.</p>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <Field label="Nombre del propietario" className="md:col-span-2">
                  <input name="ownerName" value={form.ownerName} onChange={handleChange} maxLength={120} autoComplete="off" className="field" placeholder="Nombre y apellidos" />
                </Field>
                <Field label="Teléfono del propietario">
                  <input name="ownerPhone" value={form.ownerPhone} onChange={handleChange} type="tel" inputMode="tel" maxLength={40} autoComplete="off" className="field" placeholder="600 000 000" />
                </Field>
              </div>
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-green">Fotografías</h3>
                <label className="btn-outline cursor-pointer px-4 py-2 text-xs">
                  + Añadir fotos
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
                </label>
              </div>
              <div className="rounded-lg border border-dashed border-stone-300 p-4">
                <p className="mb-3 text-xs text-stone-500">
                  Hasta {MAX_PROPERTY_IMAGES} imágenes (JPG, PNG o WebP, máx. 5 MB cada una). La primera es la principal; arrastra para reordenar.
                </p>
                {imageError && <p className="mb-3 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{imageError}</p>}
                {imageItems.length === 0 ? (
                  <p className="py-8 text-center text-sm text-stone-400">Todavía no hay fotos.</p>
                ) : (
                  <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                    {imageItems.map((item, idx) => (
                      <li
                        key={item.id}
                        className="overflow-hidden rounded-lg border border-stone-200 bg-stone-50"
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', String(idx))}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault()
                          const from = Number(e.dataTransfer.getData('text/plain'))
                          if (Number.isFinite(from) && from !== idx) moveItem(from, idx)
                        }}
                      >
                        <div className="relative aspect-[4/3]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.kind === 'existing' ? item.url : item.previewUrl} alt="" className="h-full w-full object-cover" />
                          <button type="button" onClick={() => removeItem(item.id)} className="absolute right-1.5 top-1.5 rounded bg-white/90 px-2 py-0.5 text-xs text-stone-700 shadow hover:bg-white">
                            Quitar
                          </button>
                          {idx === 0 && (
                            <span className="absolute bottom-1.5 left-1.5 rounded bg-brand-yellow px-2 py-0.5 text-[10px] font-bold uppercase text-brand-green-deep">Principal</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-green">Características (opcional)</h3>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <Field label="Disponibilidad"><input name="availability" value={form.availability} onChange={handleChange} className="field" placeholder="Ej: Inmediata" /></Field>
                <Field label="Estado de conservación"><input name="condition" value={form.condition} onChange={handleChange} className="field" placeholder="Ej: Reformado" /></Field>
                <Field label="Antigüedad"><input name="propertyAge" value={form.propertyAge} onChange={handleChange} className="field" /></Field>
                <Field label="Planta"><input name="floor" value={form.floor} onChange={handleChange} className="field" placeholder="Ej: 3ª planta" /></Field>
                <Field label="Agua caliente"><input name="hotWater" value={form.hotWater} onChange={handleChange} className="field" /></Field>
                <Field label="Tipo de calefacción"><input name="heating" value={form.heating} onChange={handleChange} className="field" placeholder="Ej: Gas natural" /></Field>
                <Field label="Extras del inmueble" className="md:col-span-3">
                  <ExtrasDropdown value={form.extras} onChange={(extras) => setForm((f) => ({ ...f, extras }))} />
                </Field>
              </div>
            </section>

            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-green">Ubicación en el mapa</h3>
              <LocationPicker
                key={editingId ?? 'nuevo'}
                lat={form.lat}
                lon={form.lon}
                query={form.location.trim() ? `${form.location.trim()}, ${form.province}` : ''}
                onChange={(lat, lon) => setForm((f) => ({ ...f, lat, lon }))}
              />
            </section>

            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-green">Certificación energética (opcional)</h3>
              <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                <Field label="Consumo (letra)"><input name="energyRating" value={form.energyRating} onChange={handleChange} maxLength={2} className="field uppercase" placeholder="E" /></Field>
                <Field label="Consumo (kWh/m²·año)"><input name="energyValue" value={form.energyValue} onChange={handleChange} type="number" step="any" className="field" /></Field>
                <Field label="Emisiones (letra)"><input name="emissionsRating" value={form.emissionsRating} onChange={handleChange} maxLength={2} className="field uppercase" placeholder="E" /></Field>
                <Field label="Emisiones (kg CO₂/m²·año)"><input name="emissionsValue" value={form.emissionsValue} onChange={handleChange} type="number" step="any" className="field" /></Field>
              </div>
            </section>

            <section className="rounded-lg bg-brand-green-tint p-4">
              <label className="flex cursor-pointer items-center gap-3 text-sm text-stone-800">
                <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} className="h-4 w-4 accent-brand-green" />
                Destacar en la página de inicio (máx. {MAX_FEATURED_ON_HOME})
              </label>
              {featuredCapError && <p className="mt-2 text-xs text-red-600">{featuredCapError}</p>}
            </section>
          </div>

          <div className="flex flex-col gap-3 border-t border-stone-200 bg-stone-50 px-6 py-4 md:px-8">
            {submitError && <p role="alert" className="text-sm text-red-600">{submitError}</p>}
            <div className="flex items-center gap-4">
              <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 disabled:opacity-50">
                {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear propiedad'}
              </button>
              <button type="button" onClick={resetEditor} className="text-sm text-stone-500 transition-colors hover:text-stone-900">
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Listado */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-stone-200 p-4 md:flex-row md:items-center md:justify-between">
          <div role="tablist" aria-label="Visibilidad" className="inline-flex rounded-lg bg-stone-100 p-1">
            {([['active', 'Publicadas'], ['archived', 'Archivadas'], ['all', 'Todas']] as const).map(([value, label]) => (
              <button
                key={value}
                role="tab"
                aria-selected={visibility === value}
                type="button"
                onClick={() => setVisibility(value)}
                className={cn('rounded-md px-4 py-1.5 text-sm font-medium transition-colors', visibility === value ? 'bg-white text-brand-green-dark shadow-sm' : 'text-stone-500 hover:text-stone-800')}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, zona, referencia o propietario…"
            aria-label="Buscar propiedades"
            className="field max-w-sm py-2"
          />
        </div>

        {canReorder && stats.published > 1 && (
          <p className="border-b border-stone-100 bg-brand-green-tint/50 px-4 py-2.5 text-xs text-stone-600">
            Usa las flechas para cambiar el orden en que aparecen en la web. Las nuevas se añaden al final.
          </p>
        )}

        {loading ? (
          <div className="p-10 text-center text-sm text-stone-400">Cargando…</div>
        ) : properties.length === 0 ? (
          <div className="p-12 text-center">
            <p className="mb-4 text-stone-500">Todavía no hay propiedades.</p>
            <button type="button" onClick={openCreate} className="btn-primary px-5 py-2.5">Crear la primera</button>
          </div>
        ) : visible.length === 0 ? (
          <div className="p-12 text-center text-stone-500">No hay propiedades que coincidan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-200 bg-stone-50">
                <tr>
                  {['Orden', 'Inmueble', 'Propietario', 'Precio', 'Tipo', 'Estado', 'Dest.', 'Acciones'].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {visible.map((p, index) => {
                  const thumb = parseImages(p.images)[0]
                  return (
                    <tr key={p.id} className={cn('transition-colors hover:bg-brand-green-tint/40', p.archived && 'opacity-70')}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => moveProperty(p.id, 'up')} disabled={reordering || !canReorder || index === 0} className="h-7 w-7 rounded border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30" aria-label="Subir">↑</button>
                          <button type="button" onClick={() => moveProperty(p.id, 'down')} disabled={reordering || !canReorder || index === visible.length - 1} className="h-7 w-7 rounded border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30" aria-label="Bajar">↓</button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-brand-green-tint">
                            {thumb && <Image src={thumb} alt="" fill unoptimized className="object-cover" sizes="64px" />}
                          </div>
                          <div className="min-w-0">
                            <span className="line-clamp-1 max-w-[260px] font-medium text-stone-900">{p.title}</span>
                            <span className="block max-w-[260px] truncate text-xs text-stone-500">
                              {p.ref ? `${p.ref} · ` : ''}{p.location}
                            </span>
                            <span className="mt-0.5 flex gap-1.5">
                              {p.demo && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">Ejemplo</span>}
                              {p.archived && <span className="rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-600">Archivada</span>}
                              {(p.lat == null || p.lon == null) && <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500" title="No aparece en el mapa público">Sin mapa</span>}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {p.ownerName || p.ownerPhone ? (
                          <>
                            {p.ownerName && <span className="block max-w-[160px] truncate font-medium text-stone-800" title={p.ownerName}>{p.ownerName}</span>}
                            {p.ownerPhone && (
                              <a href={`tel:${p.ownerPhone.replace(/[^\d+]/g, '')}`} className="whitespace-nowrap text-brand-green hover:underline">{p.ownerPhone}</a>
                            )}
                          </>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-stone-800">{formatPrice(p.price, p.operation)}</td>
                      <td className="px-4 py-3 text-stone-600">
                        {TYPE_LABELS[p.type] || p.type}
                        <span className="block text-xs text-stone-400">{OPERATION_LABELS[p.operation || 'venta']}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_BADGE_CLASSES_ADMIN[p.status])}>{STATUS_LABELS[p.status] || p.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center">{p.featured ? <span className="text-brand-yellow-dark" title="Destacada">★</span> : <span className="text-stone-300">—</span>}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 whitespace-nowrap">
                          <button type="button" onClick={() => openEdit(p)} className="text-xs font-medium text-brand-green hover:text-brand-green-dark">Editar</button>
                          {p.archived ? (
                            <>
                              <button type="button" onClick={() => setConfirm({ id: p.id, action: 'restore' })} className="text-xs font-medium text-brand-green hover:text-brand-green-dark">Reactivar</button>
                              <button type="button" onClick={() => setConfirm({ id: p.id, action: 'delete' })} className="text-xs font-medium text-red-600 hover:text-red-800">Eliminar</button>
                            </>
                          ) : (
                            <button type="button" onClick={() => setConfirm({ id: p.id, action: 'archive' })} className="text-xs font-medium text-stone-500 hover:text-stone-800">Archivar</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirm && confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-green-deep/60 px-6" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && setConfirm(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-7 shadow-2xl">
            <h3 className="mb-2 text-xl text-stone-900">
              {confirm.action === 'archive' ? '¿Archivar propiedad?' : confirm.action === 'restore' ? '¿Reactivar propiedad?' : '¿Eliminar definitivamente?'}
            </h3>
            <p className="mb-1 text-sm font-medium text-stone-700">{confirmTarget.title}</p>
            <p className="mb-6 text-sm text-stone-500">
              {confirm.action === 'archive' && 'Dejará de mostrarse en la web, pero conservarás todos los datos para reactivarla cuando quieras.'}
              {confirm.action === 'restore' && 'Volverá a mostrarse en la web pública.'}
              {confirm.action === 'delete' && 'Se borrarán sus datos y sus fotos. Esta acción no se puede deshacer.'}
            </p>
            <div className="flex items-center gap-4">
              <button type="button" onClick={runConfirmed} className={cn('px-5 py-2.5', confirm.action === 'delete' ? 'inline-flex items-center justify-center rounded-md bg-red-600 text-sm font-medium text-white hover:bg-red-700' : 'btn-primary')}>
                {confirm.action === 'archive' ? 'Archivar' : confirm.action === 'restore' ? 'Reactivar' : 'Eliminar'}
              </button>
              <button type="button" onClick={() => setConfirm(null)} className="text-sm text-stone-500 hover:text-stone-900">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
