import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Footer } from '@/components/layout/Footer'
import { HideOnAdmin } from '@/components/layout/HideOnAdmin'
import { Navbar } from '@/components/layout/Navbar'
import { AGENT } from '@/lib/contact'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.inmobiliariaillan.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${AGENT.name} | Pisos, casas y locales en Lugo`,
    template: `%s | ${AGENT.name}`,
  },
  description:
    'Inmobiliaria en Lugo: compra, venta y alquiler de pisos, casas, locales y terrenos en Lugo y provincia. Valoración gratuita de tu inmueble.',
  keywords: 'inmobiliaria lugo, pisos en lugo, casas en lugo, alquiler lugo, venta de pisos lugo, ILLAN inmobiliaria',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: AGENT.name,
    title: `${AGENT.name} | Inmobiliaria en Lugo`,
    description: AGENT.tagline,
  },
}

export const viewport: Viewport = {
  themeColor: '#1B8036',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        <main className="min-h-[60vh]">{children}</main>
        <HideOnAdmin>
          <Footer />
        </HideOnAdmin>
      </body>
    </html>
  )
}
