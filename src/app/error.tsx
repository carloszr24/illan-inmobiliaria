'use client'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-3xl text-stone-900">Algo ha ido mal</h1>
      <p className="mt-3 text-stone-600">No hemos podido cargar esta página. Inténtalo de nuevo en unos segundos.</p>
      <button type="button" onClick={reset} className="btn-primary mt-8">
        Reintentar
      </button>
    </div>
  )
}
