import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente de Supabase SOLO PARA EL SERVIDOR (usa la clave de servicio).
 * El navegador nunca habla con Supabase: todo pasa por las rutas API, que comprueban la sesión.
 *
 * Variables (ver .env.example; se definen en .env.local o en Vercel, nunca en el código):
 *   SUPABASE_URL                 https://<proyecto>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY    clave "service_role" (o la "secret key" nueva) — NUNCA NEXT_PUBLIC_
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
}

const globalForSupabase = globalThis as unknown as { __illanSupabase?: SupabaseClient }

export function supabase(): SupabaseClient {
  if (globalForSupabase.__illanSupabase) return globalForSupabase.__illanSupabase

  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) throw new Error('Supabase no está configurado (faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY)')

  globalForSupabase.__illanSupabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Next cachea fetch por defecto: sin esto, el catálogo podría mostrar datos viejos tras un cambio
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  })
  return globalForSupabase.__illanSupabase
}
