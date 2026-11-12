/**
 * Datos de contacto de ILLAN Inmobiliaria.
 * Fuente: tarjeta de visita del cliente. Lo marcado como PENDIENTE hay que confirmarlo con él.
 */

export const AGENT = {
  name: 'ILLAN Inmobiliaria',
  shortName: 'ILLAN',
  title: 'Agencia inmobiliaria en Lugo',
  tagline: 'Compra, venta y alquiler de inmuebles en Lugo y su provincia, con trato directo y cercano.',
} as const

export const LEGAL = {
  ownerName: 'Ángel González Illán',
  legalForm: 'PENDIENTE (autónomo / sociedad)',
  taxId: 'PENDIENTE',
  address: 'C/ Sierra de Outes, 25 bajo, 27004 Lugo',
} as const

export const OFFICE = {
  label: 'Oficina',
  line1: 'C/ Sierra de Outes, 25 bajo',
  line2: '27004 Lugo',
  full: 'C/ Sierra de Outes, 25 bajo, 27004 Lugo',
  /**
   * Punto de la calle (OpenStreetMap la registra como "Rúa Serra de Outes").
   * PENDIENTE: afinar a la puerta exacta del nº 25 con el cliente.
   */
  lat: 43.01289,
  lon: -7.57003,
} as const

const SITE_DOMAIN = 'inmobiliariaillan.com'

export const CONTACT = {
  office: OFFICE,
  phone: {
    display: '626 115 111',
    e164: '+34626115111',
    wa: '34626115111',
    label: 'Teléfono / WhatsApp',
  },
  email: 'inmobiliariaillan@gmail.com',
  website: `www.${SITE_DOMAIN}`,
} as const

const searchQuery = encodeURIComponent(`${OFFICE.line1}, ${OFFICE.line2}`)

export const phoneHref = `tel:${CONTACT.phone.e164}`
export const emailHref = `mailto:${CONTACT.email}`
export const whatsappHref = `https://wa.me/${CONTACT.phone.wa}`
export const whatsappDisplay = `+34 ${CONTACT.phone.display}`
/** Cómo llegar: abre OpenStreetMap con la dirección (sin claves ni cuentas). */
export const directionsHref = `https://www.openstreetmap.org/search?query=${searchQuery}`
export const mapLargeHref = `https://www.openstreetmap.org/?mlat=${OFFICE.lat}&mlon=${OFFICE.lon}#map=17/${OFFICE.lat}/${OFFICE.lon}`
