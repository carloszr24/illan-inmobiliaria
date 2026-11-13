'use client'

import { cn } from '@/lib/utils'
import {
  DESCRIPTION_CHECKLIST,
  DESCRIPTION_EXAMPLE,
  DESCRIPTION_TARGET_WORDS,
  formatSize,
  isShouting,
  PHOTO_TARGET_BYTES,
  PHOTOS_RECOMMENDED,
  TITLE_EXAMPLE,
  TITLE_MAX,
  wordCount,
} from '@/lib/form-tips'

/**
 * Consejos en vivo bajo los campos del formulario de propiedades. Se calculan mientras se escribe.
 * Regla general: avisar sin bloquear (ningún consejo impide guardar).
 */

const tone = {
  neutral: 'text-stone-500',
  warn: 'text-amber-700',
  ok: 'text-brand-green-dark',
} as const

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
      <span aria-hidden="true">⚠ </span>
      {children}
    </p>
  )
}

export function TitleTips({ title, duplicate }: { title: string; duplicate: boolean }) {
  const length = title.trim().length
  const tooLong = length > TITLE_MAX
  return (
    <div className="mt-2 space-y-2">
      <p className={cn('text-xs font-medium', tooLong ? tone.warn : length === 0 ? tone.neutral : tone.ok)}>
        {length}/{TITLE_MAX} caracteres
        {tooLong && ' · Google corta los títulos largos y los posiciona peor: acórtalo.'}
      </p>
      {isShouting(title) && <Warning>Evita escribir todo en mayúsculas: se lee peor y no ayuda al posicionamiento.</Warning>}
      {duplicate && (
        <Warning>
          Ya existe otra propiedad con este mismo título. Google puede tratarlas como duplicadas: añade un detalle que las distinga.
        </Warning>
      )}
      <p className="text-xs leading-relaxed text-stone-500">
        <strong className="font-semibold text-stone-700">Fórmula:</strong> tipo de inmueble + zona o calle + algo distintivo.
        Ejemplo: «{TITLE_EXAMPLE}».
      </p>
    </div>
  )
}

export function DescriptionTips({ description }: { description: string }) {
  const words = wordCount(description)
  const complete = words >= DESCRIPTION_TARGET_WORDS
  return (
    <div className="mt-2 space-y-2">
      <p className={cn('text-xs font-medium', complete ? tone.ok : words === 0 ? tone.neutral : tone.warn)}>
        {words} palabras de {DESCRIPTION_TARGET_WORDS}
        {words > 0 && !complete && ' · Puedes publicar así, pero las descripciones cortas posicionan peor en Google.'}
        {complete && ' · ¡Descripción completa!'}
      </p>
      {isShouting(description, 30) && <Warning>Evita las mayúsculas: dificultan la lectura y no ayudan al posicionamiento.</Warning>}
      <details className="rounded-md border border-stone-200 bg-stone-50 text-xs text-stone-600">
        <summary className="cursor-pointer select-none px-3 py-2 font-medium text-brand-green-dark">
          Qué incluir y ejemplo completo
        </summary>
        <div className="space-y-3 border-t border-stone-200 px-3 py-3 leading-relaxed">
          <div>
            <p className="mb-1 font-semibold text-stone-700">Qué conviene contar</p>
            <ul className="list-disc space-y-0.5 pl-5">
              {DESCRIPTION_CHECKLIST.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1 font-semibold text-stone-700">Ejemplo (datos inventados: sustitúyelos por los reales)</p>
            <p className="rounded border border-stone-200 bg-white p-3 text-stone-700">{DESCRIPTION_EXAMPLE}</p>
          </div>
        </div>
      </details>
    </div>
  )
}

export function PhotoTips({ count }: { count: number }) {
  const advice =
    count === 0
      ? 'Sin fotos, el inmueble se publica sin imágenes.'
      : count < PHOTOS_RECOMMENDED
        ? `Recomendado: al menos ${PHOTOS_RECOMMENDED} (fachada, salón, cocina, dormitorios, baños y exterior).`
        : 'Buen número de fotos.'
  return (
    <div className="mb-3 space-y-1.5 text-xs leading-relaxed">
      <p className="font-semibold text-stone-700">
        Objetivo: menos de {Math.round(PHOTO_TARGET_BYTES / 1024)} KB por foto. Se reducen solas al añadirlas; si alguna sale en
        ámbar, puedes comprimirla antes en{' '}
        <a href="https://tinypng.com" target="_blank" rel="noopener noreferrer" className="text-brand-green underline underline-offset-2">
          tinypng.com
        </a>
        .
      </p>
      <p className={cn('font-medium', count === 0 ? tone.neutral : count < PHOTOS_RECOMMENDED ? tone.warn : tone.ok)}>
        {count} {count === 1 ? 'foto' : 'fotos'} · {advice}
      </p>
      <p className="text-stone-500">
        No hay límite de fotos. <strong className="font-semibold text-stone-700">La primera es la portada</strong> (la que se ve en
        el listado): elige la mejor y arrastra para reordenar.
      </p>
    </div>
  )
}

/** Etiqueta con el peso de la foto: verde si está bien, ámbar si pesa de más. */
export function PhotoWeightTag({ bytes }: { bytes?: number }) {
  if (!bytes || bytes <= 0) return null
  const ok = bytes <= PHOTO_TARGET_BYTES
  return (
    <span
      title={ok ? 'Peso adecuado' : `Pesa más de ${Math.round(PHOTO_TARGET_BYTES / 1024)} KB: puedes comprimirla en tinypng.com`}
      className={cn(
        'absolute bottom-1.5 right-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white shadow',
        ok ? 'bg-brand-green' : 'bg-amber-500'
      )}
    >
      {formatSize(bytes)}
    </span>
  )
}
