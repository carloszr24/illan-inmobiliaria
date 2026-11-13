import { randomUUID } from 'crypto'
import { DEMO_LEADS } from '@/data/demo-leads'
import { LEAD_INTENTS, LEAD_PRIORITIES, LEAD_SOURCES, LEAD_STATUSES } from '@/lib/leads'
import { leadRepo } from '@/lib/store'
import type { LeadRecord } from '@/lib/store/records'
import type { Lead, LeadIntent, LeadPriority, LeadSource, LeadStatus, NotifyStatus } from '@/types'

const toLead = (r: LeadRecord): Lead => ({
  ...r,
  createdAt: new Date(r.createdAt),
  updatedAt: new Date(r.updatedAt),
  firstResponseAt: r.firstResponseAt ? new Date(r.firstResponseAt) : null,
  lastContactAt: r.lastContactAt ? new Date(r.lastContactAt) : null,
})

export async function listLeads(): Promise<Lead[]> {
  const records = await leadRepo().list()
  return [...records]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 500)
    .map(toLead)
}

export type NewLeadInput = {
  fullName: string
  phone: string
  email: string | null
  notes: string | null
  source: LeadSource
  intent: LeadIntent
  priority: LeadPriority
  propertyRef: string | null
  saleTimeline: string | null
}

export async function createLead(input: NewLeadInput): Promise<Lead> {
  const now = new Date().toISOString()
  const record: LeadRecord = {
    id: randomUUID(),
    ...input,
    status: 'nuevo',
    assignedTo: null,
    firstResponseAt: null,
    lastContactAt: null,
    notifyStatus: null,
    notifyError: null,
    createdAt: now,
    updatedAt: now,
  }
  await leadRepo().insert(record)
  return toLead(record)
}

export type LeadPatch = {
  status?: LeadStatus
  priority?: LeadPriority
  notes?: string | null
  assignedTo?: string | null
  lastContactAt?: string
  notifyStatus?: NotifyStatus
  notifyError?: string | null
}

export async function updateLead(id: string, patch: LeadPatch): Promise<Lead | null> {
  const repo = leadRepo()
  return repo.withLock(async () => {
    const current = await repo.get(id)
    if (!current) return null
    const now = new Date().toISOString()
    const updated: LeadRecord = {
      ...current,
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.priority ? { priority: patch.priority } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(patch.assignedTo !== undefined ? { assignedTo: patch.assignedTo } : {}),
      ...(patch.lastContactAt ? { lastContactAt: patch.lastContactAt } : {}),
      ...(patch.notifyStatus ? { notifyStatus: patch.notifyStatus } : {}),
      ...(patch.notifyError !== undefined ? { notifyError: patch.notifyError } : {}),
      firstResponseAt: current.firstResponseAt ?? (patch.status && patch.status !== 'nuevo' ? now : null),
      updatedAt: now,
    }
    return (await repo.update(updated)) ? toLead(updated) : null
  })
}

export async function deleteLead(id: string): Promise<boolean> {
  const repo = leadRepo()
  return repo.withLock(() => repo.remove(id))
}

/** Carga los contactos de ejemplo, solo si no hay ninguno. Devuelve cuántos se han creado. */
export async function seedDemoLeads(): Promise<number> {
  const repo = leadRepo()
  return repo.withLock(async () => {
    if ((await repo.list()).length > 0) return 0
    for (const demo of DEMO_LEADS) await repo.insert({ ...(demo as LeadRecord), notifyStatus: null, notifyError: null })
    return DEMO_LEADS.length
  })
}

/** Elimina SOLO los contactos marcados como ejemplo (demo). Devuelve cuántos se han eliminado. */
export async function deleteDemoLeads(): Promise<number> {
  const repo = leadRepo()
  const demos = (await repo.list()).filter((l) => l.demo)
  let removed = 0
  for (const demo of demos) if (await repo.withLock(() => repo.remove(demo.id))) removed++
  return removed
}

export const isLeadSource = (v: string): v is LeadSource => (LEAD_SOURCES as string[]).includes(v)
export const isLeadIntent = (v: string): v is LeadIntent => (LEAD_INTENTS as string[]).includes(v)
export const isLeadPriority = (v: string): v is LeadPriority => (LEAD_PRIORITIES as string[]).includes(v)
export const isLeadStatus = (v: string): v is LeadStatus => (LEAD_STATUSES as string[]).includes(v)
