import { useEffect, useState, useCallback } from 'react'
import {
  Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, X, Loader2,
} from 'lucide-react'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import {
  fetchPatients,
  fetchFilterOptions,
  createPatient,
  updatePatient,
  deletePatient,
} from '../services/patientService'
import type { Patient } from '../types'

const PAGE_SIZE = 15

// ─── Patient Form Modal ───────────────────────────────────────────────────────

interface FormState {
  patient_code: string
  name: string
  age: string
  gender: string
  mri_type: string
  priority: string
  status: string
  registration_date: string
  examination_date: string
}

const EMPTY_FORM: FormState = {
  patient_code: '',
  name: '',
  age: '',
  gender: '',
  mri_type: '',
  priority: '',
  status: '',
  registration_date: '',
  examination_date: '',
}

interface ModalProps {
  patient?: Patient | null
  onClose: () => void
  onSaved: () => void
  filterOptions: { statuses: string[]; priorities: string[]; mriTypes: string[] }
}

function PatientModal({ patient, onClose, onSaved, filterOptions }: ModalProps) {
  const isEdit = !!patient
  const [form, setForm] = useState<FormState>(
    patient
      ? {
          patient_code: patient.patient_code,
          name: patient.name,
          age: String(patient.age),
          gender: patient.gender,
          mri_type: patient.mri_type,
          priority: patient.priority,
          status: patient.status,
          registration_date: patient.registration_date,
          examination_date: patient.examination_date,
        }
      : EMPTY_FORM
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.patient_code.trim()) {
      setError('Patient code and name are required.')
      return
    }
    try {
      setSaving(true)
      setError(null)
      const payload = { ...form, age: parseInt(form.age, 10) || 0 }
      if (isEdit && patient) {
        await updatePatient(patient.id, payload)
      } else {
        await createPatient(payload as Omit<Patient, 'id'>)
      }
      onSaved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const genders = ['Male', 'Female', 'Other']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            {isEdit ? 'Edit Patient' : 'Add Patient'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Patient Code *</label>
              <input
                name="patient_code"
                value={form.patient_code}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Age</label>
              <input
                name="age"
                type="number"
                min="0"
                max="150"
                value={form.age}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Gender</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select…</option>
                {genders.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">MRI Type</label>
            <select
              name="mri_type"
              value={form.mri_type}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select…</option>
              {filterOptions.mriTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Priority</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select…</option>
                {filterOptions.priorities.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select…</option>
                {filterOptions.statuses.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Registration Date</label>
              <input
                name="registration_date"
                type="date"
                value={form.registration_date}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Examination Date</label>
              <input
                name="examination_date"
                type="date"
                value={form.examination_date}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirmation ───────────────────────────────────────────────────────

interface DeleteConfirmProps {
  patient: Patient
  onClose: () => void
  onDeleted: () => void
}

function DeleteConfirm({ patient, onClose, onDeleted }: DeleteConfirmProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    try {
      setDeleting(true)
      await deletePatient(patient.id)
      onDeleted()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Delete Patient</h2>
        <p className="text-sm text-slate-500 mb-4">
          Are you sure you want to delete <span className="font-medium text-slate-700">{patient.name}</span>?
          This action cannot be undone.
        </p>
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterMriType, setFilterMriType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterOptions, setFilterOptions] = useState<{
    statuses: string[]; priorities: string[]; mriTypes: string[]
  }>({ statuses: [], priorities: [], mriTypes: [] })

  const [modalOpen, setModalOpen] = useState(false)
  const [editPatient, setEditPatient] = useState<Patient | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null)

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchPatients({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status: filterStatus || undefined,
        priority: filterPriority || undefined,
        mriType: filterMriType || undefined,
      })
      setPatients(result.data)
      setTotalCount(result.count)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load patients')
    } finally {
      setLoading(false)
    }
  }, [page, search, filterStatus, filterPriority, filterMriType])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetchFilterOptions().then(setFilterOptions).catch(console.error)
  }, [])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(0)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  function handleFilterChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      setter(e.target.value)
      setPage(0)
    }
  }

  function openAdd() {
    setEditPatient(null)
    setModalOpen(true)
  }

  function openEdit(p: Patient) {
    setEditPatient(p)
    setModalOpen(true)
  }

  function formatDate(d: string) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const startRow = page * PAGE_SIZE + 1
  const endRow = Math.min((page + 1) * PAGE_SIZE, totalCount)

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Patient Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {totalCount.toLocaleString()} total records
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Patient
        </button>
      </div>

      {/* Filters */}
      <Card className="px-5 py-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name or code…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={handleFilterChange(setFilterStatus)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px]"
          >
            <option value="">All Statuses</option>
            {filterOptions.statuses.map((s) => <option key={s}>{s}</option>)}
          </select>

          {/* Priority */}
          <select
            value={filterPriority}
            onChange={handleFilterChange(setFilterPriority)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px]"
          >
            <option value="">All Priorities</option>
            {filterOptions.priorities.map((p) => <option key={p}>{p}</option>)}
          </select>

          {/* MRI Type */}
          <select
            value={filterMriType}
            onChange={handleFilterChange(setFilterMriType)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
          >
            <option value="">All MRI Types</option>
            {filterOptions.mriTypes.map((t) => <option key={t}>{t}</option>)}
          </select>

          {/* Clear */}
          {(searchInput || filterStatus || filterPriority || filterMriType) && (
            <button
              onClick={() => {
                setSearchInput('')
                setFilterStatus('')
                setFilterPriority('')
                setFilterMriType('')
                setPage(0)
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        {error && (
          <div className="px-5 py-4 text-sm text-red-600">Error: {error}</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Code', 'Name', 'Age', 'Gender', 'MRI Type', 'Priority', 'Status', 'Exam Date', ''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading patients…
                    </div>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-400">
                    No patients found matching your filters.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.patient_code}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600">{p.age}</td>
                    <td className="px-4 py-3 text-slate-600">{p.gender}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.mri_type}</td>
                    <td className="px-4 py-3">
                      <Badge value={p.priority} variant="priority" />
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={p.status} variant="status" />
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(p.examination_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing {startRow}–{endRow} of {totalCount.toLocaleString()} patients
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-600 px-2">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      {modalOpen && (
        <PatientModal
          patient={editPatient}
          onClose={() => setModalOpen(false)}
          onSaved={load}
          filterOptions={filterOptions}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          patient={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={load}
        />
      )}
    </div>
  )
}
