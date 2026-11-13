import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/legal/LegalPageShell'
import { AGENT, CONTACT, LEGAL } from '@/lib/contact'

export const metadata: Metadata = { title: 'Política de privacidad' }

export default function PoliticaPrivacidadPage() {
  return (
    <LegalPageShell title="Política de privacidad" updated="noviembre de 2026">
      <h2>1. Responsable del tratamiento</h2>
      <ul>
        <li><strong>Responsable:</strong> {LEGAL.ownerName} ({AGENT.name})</li>
        <li><strong>NIF/CIF:</strong> {LEGAL.taxId}</li>
        <li><strong>Dirección:</strong> {LEGAL.address}</li>
        <li><strong>Email de contacto:</strong> {CONTACT.email}</li>
        <li><strong>Teléfono:</strong> {CONTACT.phone.display}</li>
      </ul>

      <h2>2. Qué datos recogemos y para qué</h2>
      <p>
        Cuando rellenas el formulario de contacto o el de valoración gratuita, tratamos los datos que nos facilitas
        (nombre, teléfono, email si lo indicas y el contenido de tu mensaje o los datos del inmueble) para:
      </p>
      <ul>
        <li>Atender tu consulta o solicitud y ponernos en contacto contigo.</li>
        <li>Preparar la valoración de tu inmueble o informarte de los inmuebles que te interesan.</li>
      </ul>

      <h2>3. Base jurídica</h2>
      <p>
        El tratamiento se basa en tu consentimiento, que otorgas al marcar la casilla de aceptación y enviar el
        formulario, y en la aplicación de medidas precontractuales solicitadas por ti.
      </p>

      <h2>4. Destinatarios</h2>
      <p>
        No cedemos tus datos a terceros salvo obligación legal. Pueden acceder a ellos proveedores que prestan servicios
        a la agencia (por ejemplo, de alojamiento web, base de datos y envío de correo electrónico) en calidad de encargados del
        tratamiento. Algunos pueden tratar los datos fuera del Espacio Económico Europeo; en ese caso se aplican las garantías
        previstas en el RGPD.
      </p>

      <h2>5. Conservación</h2>
      <p>
        Conservamos tus datos durante el tiempo necesario para atender tu solicitud y, después, durante los plazos de
        prescripción de posibles responsabilidades legales.
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a{' '}
        <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>. Si consideras que no hemos tratado tus datos
        correctamente, puedes reclamar ante la Agencia Española de Protección de Datos (
        <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>).
      </p>

      <h2>7. Mapas</h2>
      <p>
        La web muestra mapas basados en OpenStreetMap (oficina e inmuebles). Al cargarlos, tu navegador descarga las imágenes del mapa de los servidores de la
        Fundación OpenStreetMap, que pueden recibir tu dirección IP. No se utilizan para ello claves ni cuentas de
        {' '}{AGENT.name}.
      </p>

      <h2>8. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas razonables para proteger tus datos frente a accesos no autorizados,
        pérdida o alteración.
      </p>
    </LegalPageShell>
  )
}
