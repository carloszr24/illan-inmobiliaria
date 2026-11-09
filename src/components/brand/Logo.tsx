import { cn } from '@/lib/utils'

/**
 * Logotipo de ILLAN recreado en SVG a partir de la tarjeta de visita:
 * letras amarillas con contorno blanco sobre verde y "Inmobiliaria" en cursiva negrita.
 * Cuando el cliente entregue el archivo original del logo (SVG/PNG), basta con sustituir
 * este componente por una <Image> con ese archivo.
 *
 * variant="onGreen"  → para fondos verdes (cabecera, pie, hero)
 * variant="badge"    → para fondos claros: dibuja el panel verde de la tarjeta alrededor
 */
type LogoProps = {
  variant?: 'onGreen' | 'badge'
  className?: string
  showTagline?: boolean
}

const SERIF = "Georgia, 'Times New Roman', Times, serif"

export function Logo({ variant = 'onGreen', className, showTagline = true }: LogoProps) {
  const badge = variant === 'badge'
  const height = showTagline ? 96 : 66
  const wordProps = {
    x: 160,
    y: 58,
    textAnchor: 'middle' as const,
    fontFamily: SERIF,
    fontWeight: 700,
    fontSize: 64,
    textLength: 292,
    lengthAdjust: 'spacingAndGlyphs' as const,
    strokeLinejoin: 'round' as const,
  }

  return (
    <svg
      viewBox={`0 0 320 ${height}`}
      role="img"
      aria-label="ILLAN Inmobiliaria"
      className={cn('block h-auto w-full', className)}
    >
      {badge && <rect width="320" height={height} rx="10" fill="#1B8036" />}
      <text {...wordProps} fill="none" stroke="#0D4720" strokeWidth="9">
        ILLAN
      </text>
      <text {...wordProps} fill="none" stroke="#FFFFFF" strokeWidth="6">
        ILLAN
      </text>
      <text {...wordProps} fill="#E8DC2D">
        ILLAN
      </text>
      {showTagline && (
        <text
          x="160"
          y="90"
          textAnchor="middle"
          fontFamily={SERIF}
          fontWeight={700}
          fontStyle="italic"
          fontSize="25"
          letterSpacing="1.5"
          fill="#FFFFFF"
        >
          Inmobiliaria
        </text>
      )}
    </svg>
  )
}
