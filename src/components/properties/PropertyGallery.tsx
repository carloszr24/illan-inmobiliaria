'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function PropertyGallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + images.length) % images.length),
    [images.length]
  )

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [lightbox, go])

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-xl bg-brand-green-tint text-sm uppercase tracking-[0.18em] text-stone-400">
        Sin foto disponible
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightbox(true)}
        className="group relative block aspect-[16/10] w-full overflow-hidden rounded-xl bg-brand-green-tint"
        aria-label="Ampliar foto"
      >
        <Image src={images[index]} alt={`${title} — foto ${index + 1}`} fill unoptimized priority className="object-cover" sizes="(max-width: 1024px) 100vw, 66vw" />
        <span className="absolute bottom-3 right-3 rounded bg-black/55 px-3 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          Ampliar
        </span>
      </button>

      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {images.map((src, i) => (
            <li key={src + i}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  'relative block aspect-[4/3] w-full overflow-hidden rounded-md border-2 transition-all',
                  i === index ? 'border-brand-green' : 'border-transparent opacity-70 hover:opacity-100'
                )}
              >
                <Image src={src} alt="" fill unoptimized className="object-cover" sizes="120px" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Galería de fotos"
          onMouseDown={(e) => e.target === e.currentTarget && setLightbox(false)}
        >
          <button type="button" onClick={() => setLightbox(false)} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25" aria-label="Cerrar">
            ×
          </button>
          {images.length > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} className="absolute left-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25" aria-label="Anterior">
                ‹
              </button>
              <button type="button" onClick={() => go(1)} className="absolute right-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25" aria-label="Siguiente">
                ›
              </button>
            </>
          )}
          <div className="relative h-[80vh] w-full max-w-5xl">
            <Image src={images[index]} alt={`${title} — foto ${index + 1}`} fill unoptimized className="object-contain" sizes="100vw" />
          </div>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/60 px-3 py-1 text-xs text-white">
            {index + 1} / {images.length}
          </p>
        </div>
      )}
    </div>
  )
}
