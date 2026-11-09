'use client'

import { useEffect, useRef, useState } from 'react'
import { PROPERTY_EXTRA_OPTIONS, type PropertyExtraId } from '@/lib/property-extras'

interface ExtrasDropdownProps {
  value: PropertyExtraId[]
  onChange: (value: PropertyExtraId[]) => void
}

export function ExtrasDropdown({ value, onChange }: ExtrasDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const toggleExtra = (extraId: PropertyExtraId) => {
    if (value.includes(extraId)) {
      onChange(value.filter((item) => item !== extraId))
      return
    }
    onChange([...value, extraId])
  }

  const summary =
    value.length === 0
      ? 'Seleccionar extras'
      : value.map((extraId) => PROPERTY_EXTRA_OPTIONS.find((option) => option.value === extraId)?.label).filter(Boolean).join(', ')

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 border border-stone-300 bg-white px-3 py-2.5 text-left text-sm text-stone-900 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-md"
        aria-expanded={open}
      >
        <span className={value.length === 0 ? 'text-stone-400' : 'text-stone-900'}>{summary}</span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
          className={`h-4 w-4 shrink-0 text-stone-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-stone-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-[11px] text-stone-400">
            Los extras marcados aquí son los mismos que podrán filtrar los clientes.
          </p>
          <div className="grid gap-1">
            {PROPERTY_EXTRA_OPTIONS.map((option) => {
              const checked = value.includes(option.value)
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm transition-colors ${
                    checked ? 'bg-brand-green-tint text-stone-900' : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleExtra(option.value)}
                    className="accent-brand-green"
                  />
                  {option.label}
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
