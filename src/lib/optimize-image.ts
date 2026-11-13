import sharp from 'sharp'

const MAX_WIDTH = 1920
const WEBP_QUALITY = 82

/**
 * Prepara una foto para publicarla: WebP de como máximo 1920 px, sin metadatos (EXIF/GPS).
 *
 * El panel ya reduce las fotos en el navegador (WebP ≤ 1800 px, sin metadatos). Si llega una así, se guarda
 * TAL CUAL: recomprimir un WebP ya comprimido lo haría pesar más y la foto acabaría pesando más de lo que
 * el panel indicó al subirla. Cualquier otra cosa (JPG/PNG sin reducir, WebP con metadatos o demasiado
 * grande) se orienta, se redimensiona y se convierte.
 */
export async function optimizePropertyImage(buffer: Buffer): Promise<{ data: Buffer; contentType: string; ext: string }> {
  const base = sharp(buffer, { failOn: 'none' })
  const metadata = await base.metadata()

  const alreadyOptimized =
    metadata.format === 'webp' && (metadata.width ?? Infinity) <= MAX_WIDTH && !metadata.exif && !metadata.xmp
  if (alreadyOptimized) return { data: buffer, contentType: 'image/webp', ext: 'webp' }

  let pipeline = base.rotate()
  if (metadata.width && metadata.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true })
  }
  const data = await pipeline.webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer()
  return { data, contentType: 'image/webp', ext: 'webp' }
}
