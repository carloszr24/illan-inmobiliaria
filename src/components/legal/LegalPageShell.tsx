import { PageHero } from '@/components/layout/PageHero'

export function LegalPageShell({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: React.ReactNode
}) {
  return (
    <>
      <PageHero eyebrow="Información legal" title={title} subtitle={`Última actualización: ${updated}`} />
      <div className="mx-auto max-w-3xl px-6 py-14 md:px-10">
        <div className="space-y-4 leading-relaxed text-stone-700 [&_a]:font-medium [&_a]:text-brand-green [&_a]:underline [&_h2]:mb-1 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:text-stone-900 [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-stone-900">
          {children}
        </div>
        <p className="mt-12 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Borrador para revisar:</strong> este texto es una plantilla general. Antes de publicar la web hay que
          completar los datos marcados como «PENDIENTE» y que un profesional revise su adecuación a la actividad real de
          la agencia.
        </p>
      </div>
    </>
  )
}
