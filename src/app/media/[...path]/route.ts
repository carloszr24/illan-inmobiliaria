import { promises as fs } from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { uploadsDir } from '@/lib/store/json-store'

/**
 * Sirve las fotos subidas desde el panel (data/uploads). Se hace con una ruta propia porque
 * Next solo sirve de public/ lo que existía al arrancar, no lo subido después.
 */
export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const segments = (await params).path
  if (segments.length !== 2 || !/^[a-z0-9][a-z0-9-]*$/.test(segments[0]) || !/^[a-f0-9-]{36}\.webp$/.test(segments[1])) {
    return new NextResponse('No encontrado', { status: 404 })
  }

  const root = path.resolve(/*turbopackIgnore: true*/ uploadsDir())
  const file = path.resolve(/*turbopackIgnore: true*/ root, segments[0], segments[1])
  if (!file.startsWith(root + path.sep)) return new NextResponse('No encontrado', { status: 404 })

  try {
    const data = await fs.readFile(file)
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': 'image/webp',
        // Los nombres son UUID: el contenido de una URL nunca cambia.
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new NextResponse('No encontrado', { status: 404 })
  }
}
