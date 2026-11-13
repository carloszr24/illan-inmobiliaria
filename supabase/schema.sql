-- ════════════════════════════════════════════════════════════════════════════
-- ILLAN Inmobiliaria · esquema de Supabase (un único archivo, en el orden correcto)
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar TODO este archivo → Run.
-- Es idempotente: se puede volver a ejecutar sin romper nada ni borrar datos.
--
-- SEGURIDAD (importante):
--   · RLS está ACTIVADA en todas las tablas y NO hay ninguna política: la clave pública
--     (anon) no puede leer ni escribir nada. Así los datos del propietario y los contactos
--     no se pueden consultar saltándose la web.
--   · La web accede siempre desde el servidor con la clave de servicio (SUPABASE_SERVICE_ROLE_KEY),
--     que ignora RLS, y es la web quien decide qué se publica.
--   · NO uses el setup-completo.sql del proyecto de YMAR: está desfasado y tiene id uuid.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. Propiedades ──────────────────────────────────────────────────────────

create table if not exists public.properties (
  id text primary key,                    -- slug del título, p. ej. "piso-3-dormitorios-centro-lugo" (NO uuid)
  ref text,                               -- referencia visible, p. ej. ILL-0007
  title text not null,
  price double precision not null default 0,
  location text not null,
  province text,
  type text not null default 'piso',
  operation text not null default 'venta',
  status text not null default 'disponible',
  description text not null,
  images text not null default '[]',      -- JSON con la lista de URLs, en orden
  portal_url text,
  bedrooms integer,
  bathrooms integer,
  sq_meters double precision,
  availability text,
  hot_water text,
  heating text,
  condition text,
  property_age text,
  floor text,
  garage text,
  elevator text,
  furnished text,
  extras jsonb not null default '[]'::jsonb,
  energy_rating text,
  energy_value double precision,
  emissions_rating text,
  emissions_value double precision,
  lat double precision,
  lon double precision,
  owner_name text,                        -- dato INTERNO: nunca se sirve a la web pública
  owner_phone text,                       -- dato INTERNO: nunca se sirve a la web pública
  featured boolean not null default false,
  archived boolean not null default false,
  sort_order integer not null default 0,
  demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint properties_operation_chk check (operation in ('venta', 'alquiler')),
  constraint properties_status_chk check (status in ('disponible', 'reservado', 'vendido')),
  constraint properties_type_chk check (type in ('piso', 'casa', 'local', 'terreno', 'oficina', 'garaje')),
  constraint properties_lat_chk check (lat is null or (lat between -90 and 90)),
  constraint properties_lon_chk check (lon is null or (lon between -180 and 180))
);

create unique index if not exists properties_ref_key on public.properties (ref) where ref is not null;
create index if not exists properties_order_idx on public.properties (sort_order, created_at desc);
create index if not exists properties_visible_idx on public.properties (archived, featured);

alter table public.properties enable row level security;
-- (sin políticas a propósito: solo el servidor, con la clave de servicio, accede)

-- ─── 2. Contactos (leads) ────────────────────────────────────────────────────

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text not null,
  source text not null default 'web_contacto',
  intent text not null default 'otro',
  status text not null default 'nuevo',
  priority text not null default 'media',
  property_ref text,
  notes text,
  sale_timeline text,
  assigned_to text,
  first_response_at timestamptz,
  last_contact_at timestamptz,
  notify_status text,                     -- 'sent' | 'failed' | 'skipped': resultado del aviso por email
  notify_error text,
  demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_created_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);

alter table public.leads enable row level security;

-- ─── 3. Límite de intentos (login del panel y formularios) ───────────────────
-- Persistente y atómico: en hosting serverless cada petición puede caer en una instancia distinta,
-- por eso no sirve un contador en memoria.

create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  attempts integer not null default 0,
  blocked_until timestamptz
);

alter table public.rate_limits enable row level security;

create or replace function public.rate_limit_hit(
  p_key text,
  p_max integer,
  p_window_minutes integer,
  p_block_minutes integer
)
returns table (allowed boolean, retry_after timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  now_ts timestamptz := now();
  r public.rate_limits%rowtype;
begin
  insert into public.rate_limits as t (key, window_start, attempts, blocked_until)
  values (p_key, now_ts, 1, null)
  on conflict (key) do update set
    attempts = case
      when t.blocked_until is not null and t.blocked_until > now_ts then t.attempts
      when t.window_start < now_ts - make_interval(mins => p_window_minutes) then 1
      else t.attempts + 1
    end,
    window_start = case
      when t.blocked_until is not null and t.blocked_until > now_ts then t.window_start
      when t.window_start < now_ts - make_interval(mins => p_window_minutes) then now_ts
      else t.window_start
    end,
    blocked_until = case
      when t.blocked_until is not null and t.blocked_until > now_ts then t.blocked_until
      when t.window_start < now_ts - make_interval(mins => p_window_minutes) then null
      else t.blocked_until
    end
  returning * into r;

  if r.blocked_until is not null and r.blocked_until > now_ts then
    return query select false, r.blocked_until;
    return;
  end if;

  if r.attempts > p_max then
    update public.rate_limits
      set blocked_until = now_ts + make_interval(mins => p_block_minutes)
      where key = p_key
      returning blocked_until into r.blocked_until;
    return query select false, r.blocked_until;
    return;
  end if;

  -- Limpieza ocasional de filas antiguas (sin necesidad de cron)
  if random() < 0.02 then
    delete from public.rate_limits
      where window_start < now_ts - interval '2 days'
        and (blocked_until is null or blocked_until < now_ts);
  end if;

  return query select true, null::timestamptz;
end;
$$;

create or replace function public.rate_limit_blocked(p_key text)
returns timestamptz
language sql
security definer
set search_path = public
stable
as $$
  select blocked_until from public.rate_limits where key = p_key and blocked_until > now();
$$;

create or replace function public.rate_limit_reset(p_key text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.rate_limits where key = p_key;
$$;

-- Solo el servidor (service_role) puede ejecutarlas
revoke all on function public.rate_limit_hit(text, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.rate_limit_blocked(text) from public, anon, authenticated;
revoke all on function public.rate_limit_reset(text) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer, integer) to service_role;
grant execute on function public.rate_limit_blocked(text) to service_role;
grant execute on function public.rate_limit_reset(text) to service_role;

-- ─── 4. Storage: fotos de los inmuebles ──────────────────────────────────────
-- Bucket público (las fotos se ven en la web) con límite de tamaño y de tipos.
-- Subir y borrar solo puede hacerlo el servidor (clave de servicio); no hacen falta políticas.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ─── Cambios futuros ─────────────────────────────────────────────────────────
-- Para añadir columnas más adelante, usa siempre "alter table ... add column if not exists ..."
-- y despliega la migración ANTES que el código que la necesite.
