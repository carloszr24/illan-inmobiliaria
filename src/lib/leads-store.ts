import { randomUUID } from 'crypto'
import { DEMO_LEADS } from '@/data/demo-leads'
import { LEAD_INTENTS, LEAD_PRIORITIES, LEAD_SOURCES, LEAD_STATUSES } from '@/lib/leads'
import { readCollection, withCollection, writeCollection } from '@/lib/store/json-store'
import type { Lead, LeadIntent, LeadPriority, LeadSource, LeadStatus } from '@/types'

const COLLECTION = 'leads'

type LeadRecord = Omit<Lead, 'createdAt' | 'updatedAt' | 'firstResponseAt' | 'lastContactAt'> & {
  createdAt: string
  updatedAt: string
  firstResponseAt: string | null
  lastContactAt: string | null
}

const toLead = (r: LeadRecord): Lead => ({
  ...r,
  createdAt: new Date(r.createdAt),
  updatedAt: new Date(r.updatedAt),
  firstResponseAt: r.firstResponseAt ? new Date(r.firstResponseAt) : null,
  lastContactAt: r.lastContactAt ? new Date(r.lastContactAt) : null,
})

const load = () => readCollection<LeadRecord>(COLLECTION, () => DEMO_LEADS as LeadRecord[])

export async function listLeads(): Promise<Lead[]> {
  const records = await load()
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
  return withCollection(COLLECTION, async () => {
    const records = await load()
    const now = new Date().toISOString()
    const record: LeadRecord = {
      id: randomUUID(),
      ...input,
      status: 'nuevo',
      assignedTo: null,
      firstResponseAt: null,
      lastContactAt: null,
      createdAt: now,
      updatedAt: now,
    }
    await writeCollection(COLLECTION, [record, ...records].slice(0, 2000))
    return toLead(record)
  })
}

export type LeadPatch = {
  status?: LeadStatus
  priority?: LeadPriority
  notes?: string | null
  assignedTo?: string | null
  lastContactAt?: string
}

export async function updateLead(id: string, patch: LeadPatch): Promise<Lead | null> {
  return withCollection(COLLECTION, async () => {
    const records = await load()
    const index = records.findIndex((l) => l.id === id)
    if (index < 0) return null
    const current = records[index]
    const now = new Date().toISOString()
    const updated: LeadRecord = {
      ...current,
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.priority ? { priority: patch.priority } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(patch.assignedTo !== undefined ? { assignedTo: patch.assignedTo } : {}),
      ...(patch.lastContactAt ? { lastContactAt: patch.lastContactAt } : {}),
      firstResponseAt:
        current.firstResponseAt ?? (patch.status && patch.status !== 'nuevo' ? now : null),
      updatedAt: now,
    }
    const next = [...records]
    next[index] = updated
    await writeCollection(COLLECTION, next)
    return toLead(updated)
  })
}

export async function deleteLead(id: string): Promise<boolean> {
  return withCollection(COLLECTION, async () => {
    const records = await load()
    if (!records.some((l) => l.id === id)) return false
    await writeCollection(COLLECTION, records.filter((l) => l.id !== id))
    return true
  })
}

export const isLeadSource = (v: string): v is LeadSource => (LEAD_SOURCES as string[]).includes(v)
export const isLeadIntent = (v: string): v is LeadIntent => (LEAD_INTENTS as string[]).includes(v)
export const isLeadPriority = (v: string): v is LeadPriority => (LEAD_PRIORITIES as string[]).includes(v)
export const isLeadStatus = (v: string): v is LeadStatus => (LEAD_STATUSES as string[]).includes(v)
