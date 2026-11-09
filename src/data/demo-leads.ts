import type { Lead } from '@/types'

/** Contactos de EJEMPLO (nombres y teléfonos ficticios) para enseñar el panel de leads. */
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000).toISOString()

type Seed = Omit<Lead, 'createdAt' | 'updatedAt' | 'firstResponseAt' | 'lastContactAt'> & {
  createdAt: string
  updatedAt: string
  firstResponseAt: string | null
  lastContactAt: string | null
}

export const DEMO_LEADS: Seed[] = [
  {
    id: 'demo-lead-1',
    fullName: 'María Fernández (ejemplo)',
    email: 'maria.ejemplo@example.com',
    phone: '600 000 001',
    source: 'web_contacto',
    intent: 'comprar',
    status: 'nuevo',
    priority: 'alta',
    propertyRef: 'ILL-0001',
    notes: 'Hola, me interesa el piso del centro. ¿Podríamos verlo este fin de semana?',
    saleTimeline: null,
    assignedTo: null,
    firstResponseAt: null,
    lastContactAt: null,
    demo: true,
    createdAt: hoursAgo(2),
    updatedAt: hoursAgo(2),
  },
  {
    id: 'demo-lead-2',
    fullName: 'Antonio López (ejemplo)',
    email: null,
    phone: '600 000 002',
    source: 'web_valoracion',
    intent: 'vender',
    status: 'contactado',
    priority: 'media',
    propertyRef: null,
    notes: 'Tipo de inmueble: Piso\nZona: Fingoi, Lugo\nSuperficie: 90 m²\nHabitaciones: 3',
    saleTimeline: 'En 3 meses',
    assignedTo: null,
    firstResponseAt: hoursAgo(20),
    lastContactAt: hoursAgo(20),
    demo: true,
    createdAt: hoursAgo(26),
    updatedAt: hoursAgo(20),
  },
  {
    id: 'demo-lead-3',
    fullName: 'Lucía Pérez (ejemplo)',
    email: 'lucia.ejemplo@example.com',
    phone: '600 000 003',
    source: 'telefono',
    intent: 'alquilar',
    status: 'visita_agendada',
    priority: 'media',
    propertyRef: 'ILL-0003',
    notes: 'Busca alquiler de 2 habitaciones cerca de colegios. Visita el jueves.',
    saleTimeline: null,
    assignedTo: null,
    firstResponseAt: hoursAgo(70),
    lastContactAt: hoursAgo(48),
    demo: true,
    createdAt: hoursAgo(72),
    updatedAt: hoursAgo(48),
  },
]
