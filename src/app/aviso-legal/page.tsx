import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/legal/LegalPageShell'
import { AGENT, CONTACT, LEGAL } from '@/lib/contact'

export const metadata: Metadata = { title: 'Aviso legal' }

export default function AvisoLegalPage() {
  return (
    <LegalPageShell title="Aviso legal" updated="noviembre de 2026">
      <h2>1. Datos identificativos</h2>
      <p>
        En cumplimiento de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico, se
        informa de que este sitio web pertenece a:
      </p>
      <ul>
        <li><strong>Denominación comercial:</strong> {AGENT.name}</li>
        <li><strong>Titular:</strong> {LEGAL.ownerName}</li>
        <li><strong>Forma jurídica:</strong> {LEGAL.legalForm}</li>
        <li><strong>NIF/CIF:</strong> {LEGAL.taxId}</li>
        <li><strong>Domicilio:</strong> {LEGAL.address}</li>
        <li><strong>Teléfono:</strong> {CONTACT.phone.display}</li>
        <li><strong>Email:</strong> {CONTACT.email}</li>
        <li><strong>Actividad:</strong> intermediación inmobiliaria (compraventa y alquiler de inmuebles).</li>
      </ul>

      <h2>2. Condiciones de uso</h2>
      <p>
        El acceso y uso de esta web atribuye la condición de usuario e implica la aceptación de este aviso legal. El
        usuario se compromete a hacer un uso adecuado de los contenidos y a no emplearlos para actividades ilícitas o
        contrarias a la buena fe.
      </p>

      <h2>3. Información de los inmuebles</h2>
      <p>
        La información, fotografías y precios de los inmuebles publicados tienen carácter meramente informativo y no
        constituyen una oferta vinculante. Pueden variar sin previo aviso y los inmuebles pueden dejar de estar
        disponibles. Para confirmar condiciones y disponibilidad, contacta con la agencia.
      </p>

      <h2>4. Propiedad intelectual e industrial</h2>
      <p>
        Los textos, imágenes, logotipos, marcas y el diseño de esta web son titularidad de {AGENT.name} o de terceros que
        han autorizado su uso. Queda prohibida su reproducción o distribución sin autorización expresa.
      </p>

      <h2>5. Responsabilidad</h2>
      <p>
        {AGENT.name} no se responsabiliza de los daños derivados de interrupciones del servicio, errores de contenido o
        de la presencia de enlaces a sitios de terceros, sobre cuyo contenido no tiene control.
      </p>

      <h2>6. Legislación aplicable</h2>
      <p>
        Este aviso legal se rige por la legislación española. Para cualquier controversia, las partes se someten a los
        juzgados y tribunales que correspondan conforme a la normativa vigente.
      </p>
    </LegalPageShell>
  )
}
