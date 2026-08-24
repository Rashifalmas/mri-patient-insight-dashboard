import { supabase } from '../lib/supabase'
import type { Patient, DashboardKPIs, ChartDataPoint, PaginatedResult } from '../types'

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function fetchLatestDate(): Promise<string> {
  const { data, error } = await supabase
    .from('patients')
    .select('examination_date')
    .order('examination_date', { ascending: false })
    .limit(1)
    .single()

  if (error) throw error
  return data.examination_date as string
}

export async function fetchLatestDateKPIs(date: string): Promise<DashboardKPIs> {
  const { data, error } = await supabase
    .from('patients')
    .select('priority, status')
    .eq('examination_date', date)

  if (error) throw error

  const rows = data ?? []
  return {
    total: rows.length,
    emergency: rows.filter((r) => r.priority?.toLowerCase() === 'emergency').length,
    waiting: rows.filter((r) => r.status?.toLowerCase() === 'waiting').length,
    completed: rows.filter((r) => r.status?.toLowerCase() === 'completed').length,
  }
}

export async function fetchDailyVolume(days = 30): Promise<ChartDataPoint[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('patients')
    .select('examination_date')
    .gte('examination_date', sinceStr)
    .order('examination_date', { ascending: true })

  if (error) throw error

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const d = row.examination_date as string
    counts[d] = (counts[d] ?? 0) + 1
  }

  return Object.entries(counts).map(([label, value]) => ({ label, value }))
}

// Returns the full daily volume map across all historical dates, used for forecast training.
// Fetches all rows in pages of BATCH_SIZE to bypass Supabase's default 1,000-row response cap.
export async function fetchAllDailyVolume(): Promise<Record<string, number>> {
  const BATCH_SIZE = 1000
  const counts: Record<string, number> = {}
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('patients')
      .select('examination_date')
      .order('examination_date', { ascending: true })
      .range(from, from + BATCH_SIZE - 1)

    if (error) throw error

    const rows = data ?? []
    for (const row of rows) {
      const d = row.examination_date as string
      if (d) counts[d] = (counts[d] ?? 0) + 1
    }

    // If we received fewer rows than requested, we have reached the end.
    if (rows.length < BATCH_SIZE) break
    from += BATCH_SIZE
  }

  return counts
}

export async function fetchMriTypeDistribution(): Promise<ChartDataPoint[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('mri_type')

  if (error) throw error

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const t = row.mri_type as string
    if (t) counts[t] = (counts[t] ?? 0) + 1
  }

  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

export async function fetchStatusDistribution(): Promise<ChartDataPoint[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('status')

  if (error) throw error

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const s = row.status as string
    if (s) counts[s] = (counts[s] ?? 0) + 1
  }

  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

// ─── Patients ─────────────────────────────────────────────────────────────────

export interface PatientListParams {
  page: number
  pageSize: number
  search?: string
  status?: string
  priority?: string
  mriType?: string
}

export async function fetchPatients(params: PatientListParams): Promise<PaginatedResult<Patient>> {
  const { page, pageSize, search, status, priority, mriType } = params
  const from = page * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('patients')
    .select('*', { count: 'exact' })
    .order('examination_date', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,patient_code.ilike.%${search}%`
    )
  }
  if (status) query = query.eq('status', status)
  if (priority) query = query.eq('priority', priority)
  if (mriType) query = query.eq('mri_type', mriType)

  const { data, count, error } = await query
  if (error) throw error

  return { data: (data ?? []) as Patient[], count: count ?? 0 }
}

export async function createPatient(patient: Omit<Patient, 'id'>): Promise<Patient> {
  const { data, error } = await supabase
    .from('patients')
    .insert(patient)
    .select()
    .single()

  if (error) throw error
  return data as Patient
}

export async function updatePatient(id: string, updates: Partial<Omit<Patient, 'id'>>): Promise<Patient> {
  const { data, error } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Patient
}

export async function deletePatient(id: string): Promise<void> {
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function fetchFilterOptions(): Promise<{
  statuses: string[]
  priorities: string[]
  mriTypes: string[]
}> {
  const { data, error } = await supabase
    .from('patients')
    .select('status, priority, mri_type')

  if (error) throw error

  const statuses = [...new Set((data ?? []).map((r) => r.status).filter(Boolean))].sort()
  const priorities = [...new Set((data ?? []).map((r) => r.priority).filter(Boolean))].sort()
  const mriTypes = [...new Set((data ?? []).map((r) => r.mri_type).filter(Boolean))].sort()

  return { statuses, priorities, mriTypes }
}
