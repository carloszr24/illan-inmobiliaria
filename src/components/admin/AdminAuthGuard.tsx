'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Logo } from '@/components/brand/Logo'
import { cn } from '@/lib/utils'

type AdminAuthGuardProps = {
  children: ReactNode | ((ctx: { logout: () => Promise<void> }) => ReactNode)
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [authed, setAuthed] = useState(false)
  const [configured, setConfigured] = useState(true)
  const [persistent, setPersistent] = useState(true)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/session', { credentials: 'include' })
      .then((r) => r.json().catch(() => ({})))
      .then((data: { authed?: boolean; configured?: boolean; persistent?: boolean }) => {
        if (data.authed) setAuthed(true)
        if (data.configured === false) setConfigured(false)
        if (data.persistent === false) setPersistent(false)
      })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [])

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (res.ok) {
        setAuthed(true)
        setPassword('')
        // Tras entrar, averigua si el almacén es persistente (para el aviso de modo demostración)
        fetch('/api/admin/session', { credentials: 'include' })
          .then((r) => r.json())
          .then((s: { persistent?: boolean }) => s.persistent === false && setPersistent(false))
          .catch(() => {})
        return
      }
      if (res.status === 403) setError('Acceso no permitido desde esta red.')
      else setError(data.error || 'Contraseña incorrecta')
    } catch {
      setError('No se pudo conectar. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
    setAuthed(false)
  }

  if (checking) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-50">
        <p className="animate-pulse text-sm text-stone-400">Comprobando sesión…</p>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-gradient-to-br from-brand-green-deep via-brand-green-dark to-brand-green px-4 py-10">
        <div className="w-full max-w-sm">
          <Logo variant="onGreen" className="mx-auto mb-8 w-[220px]" />
          <form onSubmit={login} className="rounded-2xl bg-white p-8 shadow-2xl">
            <h1 className="text-2xl text-stone-900">Panel de administración</h1>
            <p className="mt-1 text-sm text-stone-500">Introduce la contraseña para continuar.</p>

            {!configured && (
              <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                El acceso aún no está configurado en este servidor. Ejecuta <code className="font-mono">npm run setup</code>{' '}
                en la carpeta del proyecto y reinicia la web.
              </p>
            )}

            <label htmlFor="admin-password" className="field-label mt-6">Contraseña</label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
                autoComplete="current-password"
                autoFocus
                required
                className={cn('field pr-11', error && 'border-red-300 bg-red-50')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                  {showPassword ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>

            {error && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading || !password} className="btn-primary mt-6 w-full py-3 text-sm disabled:opacity-60">
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
            <a href="/" className="mt-5 block text-center text-xs text-stone-400 hover:text-brand-green">
              ← Volver a la web
            </a>
          </form>
        </div>
      </div>
    )
  }

  return (
    <>
      {!persistent && (
        <div role="status" className="mb-8 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <span aria-hidden="true" className="text-lg leading-none">⚠</span>
          <p>
            <strong>Modo demostración.</strong> Este servidor no tiene disco permanente: puedes probar el panel, pero los
            cambios (propiedades, fotos y contactos) <strong>no se guardan</strong> y desaparecen al reiniciarse. Para
            trabajar con datos reales hace falta publicar la web en un servidor con disco persistente.
          </p>
        </div>
      )}
      {typeof children === 'function' ? children({ logout }) : children}
    </>
  )
}
