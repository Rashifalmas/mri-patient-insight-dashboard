export interface Patient {
  id: string
  patient_code: string
  name: string
  age: number
  gender: string
  mri_type: string
  priority: string
  status: string
  registration_date: string
  examination_date: string
}

export interface DashboardKPIs {
  total: number
  emergency: number
  waiting: number
  completed: number
}

export interface ChartDataPoint {
  label: string
  value: number
}

export interface PaginatedResult<T> {
  data: T[]
  count: number
}
