/**
 * Ilustración decorativa del hero: perfil estilizado de Lugo (muralla con torreones,
 * dos torres de catedral y tejados de pizarra) en capas de verde corporativo.
 * Es un dibujo propio y genérico; sustituible por una fotografía real de la ciudad.
 */
function crenellations(x: number, y: number, width: number, merlon = 14, gap = 10, height = 12) {
  let d = ''
  for (let cx = x; cx < x + width; cx += merlon + gap) {
    d += `M${cx} ${y}h${merlon}v${-height}h${-merlon}z`
  }
  return d
}

function roofRow(startX: number, baseY: number, count: number, w: number, h: number, seed: number) {
  return Array.from({ length: count }, (_, i) => {
    const jitter = ((i * 37 + seed * 17) % 5) * 6
    const x = startX + i * (w + 6)
    const hh = h + jitter
    return `M${x} ${baseY}v${-hh}l${w / 2} ${-w * 0.42}l${w / 2} ${w * 0.42}v${hh}z`
  }).join('')
}

export function HeroSkyline({ className }: { className?: string }) {
  const wallY = 262
  return (
    <svg
      viewBox="0 0 1440 320"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      className={className}
      focusable="false"
    >
      {/* Colinas lejanas */}
      <path d="M0 210 Q 200 140 420 200 T 860 180 T 1240 170 T 1440 190 V320 H0Z" fill="rgb(var(--green))" opacity=".35" />
      <path d="M0 240 Q 260 190 520 230 T 1000 215 T 1440 235 V320 H0Z" fill="rgb(var(--green-dark))" opacity=".6" />

      {/* Casas de fondo */}
      <path d={roofRow(40, 270, 9, 34, 40, 1)} fill="rgb(var(--green-deep))" opacity=".55" />
      <path d={roofRow(780, 270, 12, 36, 38, 2)} fill="rgb(var(--green-deep))" opacity=".55" />

      {/* Catedral: dos torres con remate */}
      <g fill="rgb(var(--green-deep))">
        <rect x="470" y="112" width="46" height="158" />
        <polygon points="466,112 493,50 520,112" />
        <rect x="560" y="112" width="46" height="158" />
        <polygon points="556,112 583,50 610,112" />
        <rect x="516" y="168" width="44" height="102" />
        <path d="M516 168 q22 -34 44 0z" />
        <rect x="442" y="190" width="192" height="80" />
      </g>
      <g fill="rgb(var(--green))" opacity=".55">
        <rect x="486" y="132" width="14" height="30" rx="7" />
        <rect x="576" y="132" width="14" height="30" rx="7" />
        <circle cx="538" cy="200" r="11" />
      </g>
      <g fill="rgb(var(--yellow))">
        <rect x="492" y="38" width="2.5" height="14" />
        <rect x="488" y="43" width="10" height="2.5" />
        <rect x="582" y="38" width="2.5" height="14" />
        <rect x="578" y="43" width="10" height="2.5" />
      </g>

      {/* Muralla con almenas y torreones */}
      <g fill="rgb(var(--green-deep))">
        <rect x="0" y={wallY} width="1440" height="70" />
        <path d={crenellations(0, wallY, 1440)} />
        {[120, 330, 700, 930, 1180, 1370].map((tx) => (
          <g key={tx}>
            <rect x={tx - 26} y={wallY - 40} width="52" height="110" />
            <path d={crenellations(tx - 26, wallY - 40, 52, 11, 8, 11)} />
          </g>
        ))}
      </g>
      <g fill="rgb(var(--green))" opacity=".5">
        {Array.from({ length: 18 }, (_, i) => (
          <rect key={i} x={40 + i * 80} y={wallY + 22} width="9" height="20" rx="4.5" />
        ))}
      </g>

      {/* Primer plano */}
      <path d="M0 296 Q 360 280 720 296 T 1440 292 V320 H0Z" fill="rgb(var(--green-dark))" />
    </svg>
  )
}
