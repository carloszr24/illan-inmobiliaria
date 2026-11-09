import type { MetadataRoute } from 'next'
import { listPublicProperties } from '@/lib/properties'

export const dynamic = 'force-dynamic'

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.inmobiliariaillan.com').replace(/\/$/, '')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await listPublicProperties()
  const pages = ['', '/propiedades', '/servicios', '/contacto', '/aviso-legal', '/politica-privacidad', '/politica-cookies']
  return [
    ...pages.map((path) => ({ url: `${siteUrl}${path}`, changeFrequency: 'weekly' as const, priority: path === '' ? 1 : 0.6 })),
    ...properties.map((p) => ({
      url: `${siteUrl}/propiedades/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
