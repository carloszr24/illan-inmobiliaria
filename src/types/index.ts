export interface Property {
  id: string
  /** Referencia interna visible para el cliente (ej. ILL-0007). */
  ref?: string | null
  title: string
  price: number
  location: string
  province?: string | null
  type: string
  operation?: string
  status: string
  description: string
  /** JSON.stringify(string[]) con las URLs de las fotos, en orden. */
  images: string
  /** Enlace opcional al anuncio en un portal (Idealista, Fotocasa…). */
  portalUrl?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  sqMeters?: number | null
  availability?: string | null
  hotWater?: string | null
  heating?: string | null
  condition?: string | null
  propertyAge?: string | null
  floor?: string | null
  garage?: string | null
  elevator?: string | null
  furnished?: string | null
  extras?: string[] | null
  /** Ubicación en el mapa (WGS84). Opcional: sin ella el inmueble no sale en el mapa. */
  lat?: number | null
  lon?: number | null
  energyRating?: string | null
  energyValue?: number | null
  emissionsRating?: string | null
  emissionsValue?: number | null
  featured: boolean
  archived: boolean
  sortOrder: number
  /** Marca los inmuebles de ejemplo para localizarlos y borrarlos antes de publicar. */
  demo?: boolean
  createdAt: Date
  updatedAt: Date
}

export type LeadSource = 'web_contacto' | 'web_valoracion' | 'whatsapp' | 'telefono' | 'presencial' | 'otro'

export type LeadIntent = 'comprar' | 'vender' | 'alquilar' | 'otro'

export type LeadStatus =
  | 'nuevo'
  | 'contactado'
  | 'visita_agendada'
  | 'visita_realizada'
  | 'oferta'
  | 'reserva'
  | 'cerrado'
  | 'descartado'

export type LeadPriority = 'alta' | 'media' | 'baja'

export interface Lead {
  id: string
  fullName: string
  email?: string | null
  phone: string
  source: LeadSource
  intent: LeadIntent
  status: LeadStatus
  priority: LeadPriority
  propertyRef?: string | null
  notes?: string | null
  saleTimeline?: string | null
  assignedTo?: string | null
  firstResponseAt?: Date | null
  lastContactAt?: Date | null
  demo?: boolean
  createdAt: Date
  updatedAt: Date
}
