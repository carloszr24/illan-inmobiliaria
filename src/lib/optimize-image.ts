import sharp from 'sharp'

const MAX_WIDTH = 1920
const WEBP_QUALITY = 82

export async function optimizePropertyImage(buffer: Buffer): Promise<{ data: Buffer; contentType: string; ext: string }> {
  const image = sharp(buffer, { failOn: 'none' }).rotate()
  const metadata = await image.metadata()

  let pipeline = image
  if (metadata.width && metadata.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true })
  }

  const data = await pipeline.webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer()
  return { data, contentType: 'image/webp', ext: 'webp' }
}
