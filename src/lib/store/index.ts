import { jsonImageStore, jsonLeadRepo, jsonPropertyRepo } from '@/lib/store/json-repos'
import type { ImageStore, LeadRepo, PropertyRepo } from '@/lib/store/records'
import { isSupabaseConfigured } from '@/lib/store/supabase'
import { supabaseImageStore, supabaseLeadRepo, supabasePropertyRepo } from '@/lib/store/supabase-repos'

/**
 * Elige el motor de datos: Supabase si están SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY,
 * y si no, el almacén JSON local (carpeta data/).
 */
export const storeMode = (): 'supabase' | 'json' => (isSupabaseConfigured() ? 'supabase' : 'json')

export const propertyRepo = (): PropertyRepo => (isSupabaseConfigured() ? supabasePropertyRepo : jsonPropertyRepo)
export const leadRepo = (): LeadRepo => (isSupabaseConfigured() ? supabaseLeadRepo : jsonLeadRepo)
export const imageStore = (): ImageStore => (isSupabaseConfigured() ? supabaseImageStore : jsonImageStore)
