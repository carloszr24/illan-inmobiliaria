import type { Metadata } from 'next'
import { AdminNav } from '@/components/admin/AdminNav'
import { Logo } from '@/components/brand/Logo'

export const metadata: Metadata = {
  title: 'Panel de administración',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-40 border-b-4 border-brand-yellow bg-brand-green-deep text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center px-4 py-2.5 md:px-8">
          <Logo showTagline={false} className="w-[84px] md:w-[96px]" />
          <span className="ml-3 hidden border-l border-white/25 pl-3 text-xs font-medium uppercase tracking-[0.25em] text-white/70 sm:inline">
            Admin
          </span>
          <AdminNav />
          <a href="/" className="ml-auto text-sm text-white/70 transition-colors hover:text-white">
            ← Ver web
          </a>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">{children}</div>
    </div>
  )
}
