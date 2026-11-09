import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/legal/LegalPageShell'
import { AGENT, CONTACT } from '@/lib/contact'

export const metadata: Metadata = { title: 'Política de cookies' }

export default function PoliticaCookiesPage() {
  return (
    <LegalPageShell title="Política de cookies" updated="noviembre de 2026">
      <h2>1. ¿Qué son las cookies?</h2>
      <p>
        Las cookies son pequeños archivos que un sitio web guarda en tu dispositivo para recordar información sobre tu
        visita.
      </p>

      <h2>2. Cookies que usa esta web</h2>
      <p>
        {AGENT.name} <strong>no utiliza cookies de analítica, publicidad ni seguimiento</strong> en la parte pública de
        la web. Solo se emplea una cookie técnica en el panel de administración:
      </p>
      <ul>
        <li>
          <strong>illan_admin</strong> — cookie de sesión del panel de administración (solo la reciben las personas
          autorizadas que inician sesión). Es estrictamente necesaria, de tipo propio, y caduca a las pocas horas.
        </li>
      </ul>
      <p>
        Al ser cookies técnicas necesarias para prestar el servicio, no requieren consentimiento previo. Si en el futuro
        se incorporan herramientas de analítica o publicidad, se actualizará esta política y se solicitará tu
        consentimiento.
      </p>

      <h2>3. Contenido de terceros</h2>
      <p>
        Los mapas de la oficina y de los inmuebles se basan en OpenStreetMap, cuyos servidores sirven las imágenes del mapa y pueden tratar datos como tu
        dirección IP al cargarlo; consulta su política de privacidad para más información.
      </p>

      <h2>4. Cómo gestionar las cookies</h2>
      <p>
        Puedes bloquear o eliminar las cookies desde la configuración de tu navegador. Para dudas, escríbenos a{' '}
        <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
      </p>
    </LegalPageShell>
  )
}
