// Genera .env.local con una contraseña de admin y un secreto de sesión ALEATORIOS.
// - No sobrescribe un .env.local existente (usa --force para regenerarlo).
// - No imprime la contraseña por pantalla: está en el archivo (que .gitignore excluye).
import { randomBytes } from 'node:crypto'
import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const target = resolve(process.cwd(), '.env.local')
const force = process.argv.includes('--force')

if (existsSync(target) && !force) {
  console.log('.env.local ya existe: no se ha tocado. Usa "npm run setup -- --force" para regenerarlo.')
  process.exit(0)
}

// Sin caracteres ambiguos (0/O, l/1) para poder teclearla si hace falta.
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
const bytes = randomBytes(20)
const password = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
const secret = randomBytes(48).toString('base64url')

const content = `# Generado por "npm run setup". Este archivo NO se versiona (.gitignore).
ADMIN_PASSWORD=${password}
ADMIN_SESSION_SECRET=${secret}
`

writeFileSync(target, content, { mode: 0o600 })
console.log('Creado .env.local con credenciales aleatorias.')
console.log('La contraseña del panel /admin está en ese archivo (variable ADMIN_PASSWORD).')
console.log('Reinicia "npm run dev" si ya estaba en marcha.')
