import type { SVGProps } from 'react'

/** Iconos de línea (sin librerías externas). */
const base = (props: SVGProps<SVGSVGElement>) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
})

export const HomeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 11.25 12 4l9 7.25" />
    <path d="M5.25 10.5V20h13.5v-9.5" />
    <path d="M9.75 20v-5.5h4.5V20" />
  </svg>
)

export const KeyIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="8" cy="15" r="4" />
    <path d="m10.8 12.2 8.2-8.2M16 7l3 3M14 9l2 2" />
  </svg>
)

export const FileIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </svg>
)

export const ShieldIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

export const ChartIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
)

export const HandshakeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M9.5 10.5 12 13l2.5-2.5a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8l-1.4 1.4a2 2 0 0 1-2.8 0L12 13.7" />
    <path d="M14.5 10.5 12 8 9.5 10.5a2 2 0 0 1-2.8 0L3.5 7.3a2 2 0 0 1 0-2.8l1.4-1.4a2 2 0 0 1 2.8 0L12 7.3" />
  </svg>
)

export const MapPinIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
)

export const PhoneIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.87 19.87 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.87 19.87 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.35 1.77.68 2.6a2 2 0 0 1-.45 2.11L8.1 9.91a16 16 0 0 0 6 6l1.48-1.24a2 2 0 0 1 2.11-.45c.83.33 1.7.56 2.6.68A2 2 0 0 1 22 16.92Z" />
  </svg>
)

export const MailIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 6h16v12H4z" />
    <path d="m4 7 8 6 8-6" />
  </svg>
)

export const GlobeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" />
  </svg>
)

export const ArrowRightIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export const BedIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5" />
    <circle cx="7" cy="11" r="1.6" />
  </svg>
)

export const BathIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2" />
  </svg>
)

export const AreaIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 4h16v16H4z" />
    <path d="M4 10h6v10M10 4v6" />
  </svg>
)

export const WhatsAppIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M20.52 3.48A11.86 11.86 0 0 0 12.02 0C5.42 0 .05 5.36.05 11.96c0 2.1.55 4.16 1.6 5.97L0 24l6.24-1.63a11.9 11.9 0 0 0 5.78 1.48h.01c6.6 0 11.97-5.36 11.97-11.96 0-3.2-1.25-6.22-3.48-8.41Zm-8.5 18.35h-.01a9.9 9.9 0 0 1-5.05-1.39l-.36-.21-3.7.97.99-3.6-.23-.37a9.92 9.92 0 0 1-1.52-5.28c0-5.5 4.47-9.97 9.98-9.97 2.66 0 5.17 1.04 7.05 2.92a9.9 9.9 0 0 1 2.92 7.05c0 5.5-4.48 9.98-9.99 9.98Zm5.47-7.49c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.69.15-.2.3-.79.98-.96 1.18-.18.2-.35.23-.65.08-.3-.15-1.28-.47-2.43-1.49-.9-.8-1.51-1.79-1.69-2.09-.18-.3-.02-.46.14-.61.14-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.69-1.66-.94-2.28-.25-.6-.5-.52-.69-.53l-.58-.01c-.2 0-.53.08-.8.38-.28.3-1.06 1.03-1.06 2.5s1.08 2.9 1.23 3.1c.15.2 2.13 3.26 5.15 4.57.72.31 1.28.5 1.71.64.72.23 1.37.2 1.89.12.58-.09 1.78-.73 2.03-1.44.25-.7.25-1.3.18-1.44-.08-.13-.28-.2-.58-.35Z" />
  </svg>
)
