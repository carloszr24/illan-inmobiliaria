import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-24 text-center">
      <p className="font-display text-7xl font-bold text-brand-green">404</p>
      <h1 className="mt-4 text-3xl text-stone-900">No encontramos esa página</h1>
      <p className="mt-3 text-stone-600">Puede que el enlace haya cambiado o que el inmueble ya no esté disponible.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn-primary">Volver al inicio</Link>
        <Link href="/propiedades" className="btn-outline">Ver propiedades</Link>
      </div>
    </div>
  )
}
