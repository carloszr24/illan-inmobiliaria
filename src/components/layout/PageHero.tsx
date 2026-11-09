import { HeroSkyline } from '@/components/home/HeroSkyline'

/** Cabecera de las páginas interiores: banda verde con el perfil de la ciudad. */
export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="relative isolate overflow-hidden bg-gradient-to-br from-brand-green-deep via-brand-green-dark to-brand-green">
      <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-brand-yellow/20 blur-3xl" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-6 pb-6 pt-14 md:px-10 md:pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-yellow">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-balance text-4xl text-white md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-lg text-white/85">{subtitle}</p>}
      </div>
      <HeroSkyline className="pointer-events-none block h-[90px] w-full opacity-80 md:h-[130px]" />
    </div>
  )
}
