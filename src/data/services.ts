/**
 * Servicios mostrados en la web. Textos orientativos redactados para la demo:
 * confirmar con el cliente cuáles ofrece realmente (p. ej. "Seguros", que aparece en el rótulo de la oficina).
 */
export type ServiceKey = 'compraventa' | 'alquiler' | 'valoracion' | 'documentacion' | 'seguros' | 'asesoramiento'

export const SERVICE_ITEMS: { key: ServiceKey; title: string; desc: string }[] = [
  {
    key: 'compraventa',
    title: 'Compra y venta',
    desc: 'Te acompañamos en toda la operación: búsqueda o captación, visitas, negociación y firma ante notario.',
  },
  {
    key: 'alquiler',
    title: 'Alquiler',
    desc: 'Gestionamos alquileres de vivienda y de local, tanto para propietarios como para inquilinos.',
  },
  {
    key: 'valoracion',
    title: 'Valoración gratuita',
    desc: 'Una orientación realista del precio de tu inmueble según el mercado de Lugo y su entorno.',
  },
  {
    key: 'documentacion',
    title: 'Gestión de documentación',
    desc: 'Te ayudamos con la documentación necesaria: nota simple, certificado energético y trámites habituales.',
  },
  {
    key: 'seguros',
    title: 'Seguros',
    desc: 'Asesoramiento en seguros para tu vivienda o tu negocio, de la mano de tu agencia de confianza.',
  },
  {
    key: 'asesoramiento',
    title: 'Asesoramiento personal',
    desc: 'Trato directo con la persona que lleva tu operación, sin intermediarios ni sorpresas.',
  },
]

export const PROCESS_STEPS = [
  {
    title: 'Nos cuentas lo que necesitas',
    desc: 'Una llamada, un WhatsApp o una visita a la oficina: lo que buscas, lo que quieres vender o alquilar.',
  },
  {
    title: 'Te proponemos opciones',
    desc: 'Seleccionamos inmuebles que encajan contigo o valoramos el tuyo y preparamos su comercialización.',
  },
  {
    title: 'Te acompañamos hasta la firma',
    desc: 'Visitas, negociación y papeleo. Estamos contigo hasta que tienes las llaves o la venta cerrada.',
  },
]
