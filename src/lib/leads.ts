import type { LeadIntent, LeadPriority, LeadSource, LeadStatus } from '@/types'

/** Constantes y etiquetas de contactos (leads). Seguro para importar desde componentes cliente. */

export const LEAD_STATUSES: LeadStatus[] = [
  'nuevo',
  'contactado',
  'visita_agendada',
  'visita_realizada',
  'oferta',
  'reserva',
  'cerrado',
  'descartado',
]

export const LEAD_SOURCES: LeadSource[] = [
  'web_contacto',
  'web_valoracion',
  'whatsapp',
  'telefono',
  'presencial',
  'otro',
]

export const LEAD_PRIORITIES: LeadPriority[] = ['alta', 'media', 'baja']
export const LEAD_INTENTS: LeadIntent[] = ['comprar', 'vender', 'alquilar', 'otro']

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  visita_agendada: 'Visita agendada',
  visita_realizada: 'Visita realizada',
  oferta: 'Oferta',
  reserva: 'Reserva',
  cerrado: 'Cerrado',
  descartado: 'Descartado',
}

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  web_contacto: 'Web · contacto',
  web_valoracion: 'Web · valoración',
  whatsapp: 'WhatsApp',
  telefono: 'Teléfono',
  presencial: 'En oficina',
  otro: 'Otro',
}

export const LEAD_PRIORITY_LABELS: Record<LeadPriority, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
}

export const LEAD_INTENT_LABELS: Record<LeadIntent, string> = {
  comprar: 'Comprar',
  vender: 'Vender',
  alquilar: 'Alquilar',
  otro: 'Otro',
}
