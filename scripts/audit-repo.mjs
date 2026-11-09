// Auditoría del repositorio: ni claves comprometidas ni dependencias de GitHub.
// (Tener un remoto de GitHub como copia del código es válido; lo que se vigila es que la web no dependa de él.)
// Uso: npm run audit:repo   (sale con código 1 si encuentra algún problema)
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = resolve(process.cwd())
const problems = []
const notes = []

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'data', 'out', 'coverage'])
const TEXT_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|json|md|css|svg|html|yml|yaml|toml|env|example|txt)$/i

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, files)
    else files.push(full)
  }
  return files
}

const files = walk(root)

// 1) Patrones de secretos conocidos dentro del código y la documentación
const SECRET_PATTERNS = [
  [/eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/, 'token JWT (p. ej. clave de Supabase)'],
  [/sk_(live|test)_[A-Za-z0-9]{16,}/, 'clave secreta tipo Stripe'],
  [/\bsk-[A-Za-z0-9_-]{20,}/, 'clave secreta tipo OpenAI/Anthropic'],
  [/\bre_[A-Za-z0-9]{20,}/, 'clave tipo Resend'],
  [/AKIA[0-9A-Z]{16}/, 'clave de acceso de AWS'],
  [/gh[pousr]_[A-Za-z0-9]{30,}/, 'token de GitHub'],
  [/github_pat_[A-Za-z0-9_]{30,}/, 'token personal de GitHub'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'clave privada'],
  [/(service_role|SERVICE_ROLE_KEY)/, 'referencia a service_role de Supabase'],
]
const ASSIGNMENT = /\b[A-Z0-9_]*(PASSWORD|SECRET|TOKEN|API_KEY|PRIVATE_KEY|PIN)\b\s*[=:]\s*["']?([^\s"'#]{6,})/g

for (const file of files) {
  const rel = relative(root, file)
  if (rel === 'scripts/audit-repo.mjs' || rel === 'package-lock.json') continue
  if (!TEXT_EXT.test(rel) && !rel.startsWith('.env')) continue
  if (rel === '.env.local' || (rel.startsWith('.env') && rel !== '.env.example')) continue // ignorados por git; se comprueban abajo
  const text = readFileSync(file, 'utf8')
  for (const [re, label] of SECRET_PATTERNS) {
    if (re.test(text)) problems.push(`${rel}: posible ${label}`)
  }
  for (const m of text.matchAll(ASSIGNMENT)) {
    const value = m[2]
    // Se permiten referencias al entorno y valores vacíos o de ejemplo
    if (/^(process\.env|import\.meta|\$\{|<|\.\.\.|xxx|changeme|tu-)/i.test(value)) continue
    if (/^[A-Za-z_.]+\(/.test(value)) continue // llamadas a función
    if (/\.(ts|tsx)$/.test(rel) && /^[a-zA-Z_.]+$/.test(value)) continue // identificadores
    if (rel.startsWith('src/') && /(Password|PASSWORD)\s*[:=]\s*['"]?(password|nombre)/.test(m[0])) continue
    problems.push(`${rel}: asignación sospechosa → ${m[0].slice(0, 40)}…`)
  }
}

// 2) Archivos .env: solo .env.example puede estar versionado, y debe ir vacío
const gitignore = existsSync(join(root, '.gitignore')) ? readFileSync(join(root, '.gitignore'), 'utf8') : ''
if (!/^\.env\*?$/m.test(gitignore) && !/^\.env\.\*$/m.test(gitignore)) problems.push('.gitignore no excluye los archivos .env')
const example = existsSync(join(root, '.env.example')) ? readFileSync(join(root, '.env.example'), 'utf8') : ''
for (const line of example.split('\n')) {
  const m = /^([A-Z0-9_]+)=(.+)$/.exec(line.trim())
  if (m) problems.push(`.env.example: ${m[1]} trae un valor; debe ir vacío`)
}

// 3) Dependencias: nada que venga de GitHub u otras fuentes que no sean el registro de npm
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
  for (const [name, spec] of Object.entries(pkg[section] ?? {})) {
    if (/^(github:|git\+|git:|https?:|file:|[\w-]+\/[\w.-]+$)/.test(String(spec))) {
      problems.push(`package.json: "${name}" se instala desde "${spec}" (no es el registro de npm)`)
    }
  }
}
if (existsSync(join(root, 'package-lock.json'))) {
  const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'))
  const hosts = new Set()
  for (const [path, info] of Object.entries(lock.packages ?? {})) {
    if (info.resolved) {
      const host = new URL(info.resolved).host
      hosts.add(host)
      if (host !== 'registry.npmjs.org') problems.push(`package-lock.json: ${path || '(raíz)'} resuelve desde ${host}`)
    }
  }
  notes.push(`package-lock.json: ${[...hosts].join(', ') || 'sin paquetes'}`)
}
for (const dir of ['.github', '.gitlab', '.vercel']) {
  if (existsSync(join(root, dir))) problems.push(`Existe la carpeta ${dir}/ (integración con plataforma externa)`)
}

// 4) Git: sin remotos configurados
if (existsSync(join(root, '.git'))) {
  try {
    const remotes = execFileSync('git', ['remote', '-v'], { cwd: root, encoding: 'utf8' }).trim()
    if (!remotes) notes.push('git: sin remotos (el repositorio es solo local)')
    for (const line of remotes.split('\n').filter((l) => l.endsWith('(push)'))) {
      // Un remoto es solo una copia del código: la web no depende de él. Lo que no puede haber es un token en la URL.
      if (/\/\/[^/@\s]+(:[^@\s]*)?@/.test(line)) problems.push('un remoto de git lleva usuario/token en la URL (se guardaría en .git/config)')
      else notes.push(`git: remoto ${line.replace(/\s*\(push\)$/, '')} (solo copia del código)`)
    }
    const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
      .split('\n')
      .filter((f) => /(^|\/)\.env/.test(f) && f !== '.env.example')
    for (const f of tracked) problems.push(`git está versionando ${f}`)
  } catch {
    notes.push('git: no se pudo consultar')
  }
} else {
  notes.push('git: la carpeta aún no es un repositorio')
}

console.log(`Archivos revisados: ${files.length}`)
for (const n of notes) console.log(`  · ${n}`)
if (problems.length) {
  console.error(`\n✗ ${problems.length} problema(s):`)
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}
console.log('\n✓ Sin claves en el código ni dependencias de GitHub.')
