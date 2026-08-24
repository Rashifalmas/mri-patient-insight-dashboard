import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Users, AlertTriangle, Clock, CheckCircle, Lightbulb, Zap, Loader2, RefreshCw,
} from 'lucide-react'
import KpiCard from '../components/ui/KpiCard'
import Card from '../components/ui/Card'
import {
  fetchLatestDate,
  fetchLatestDateKPIs,
  fetchDailyVolume,
  fetchMriTypeDistribution,
  fetchStatusDistribution,
  fetchAllDailyVolume,
} from '../services/patientService'
import {
  generateAIInsights,
  type AIInsightsResult,
  type AnalyticsSummary,
} from '../services/langflowService'
import { buildWeekdayMeans, generateForecast } from '../lib/forecast'
import type { DashboardKPIs, ChartDataPoint } from '../types'

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function DashboardPage() {
  const [latestDate, setLatestDate] = useState<string | null>(null)
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [dailyVolume, setDailyVolume] = useState<ChartDataPoint[]>([])
  const [mriTypes, setMriTypes] = useState<ChartDataPoint[]>([])
  const [statuses, setStatuses] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // AI state — null = not yet requested
  const [aiResult, setAiResult] = useState<AIInsightsResult | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const date = await fetchLatestDate()
        const [k, dv, mt, st] = await Promise.all([
          fetchLatestDateKPIs(date),
          fetchDailyVolume(30),
          fetchMriTypeDistribution(),
          fetchStatusDistribution(),
        ])
        setLatestDate(date)
        setKpis(k)
        setDailyVolume(dv)
        setMriTypes(mt)
        setStatuses(st)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleGenerateInsights() {
    if (!latestDate || !kpis) return
    try {
      setAiLoading(true)
      setAiError(null)
      setAiResult(null)

      // Re-fetch dailyCounts fresh at click time so the forecast training data
      // is always consistent with what the Forecast page sees at this moment.
      const dailyCounts = await fetchAllDailyVolume()

      const recentDates = Object.keys(dailyCounts)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        .filter((d) => d <= latestDate)
        .slice(-7)
      const average_7_days =
        recentDates.length > 0
          ? Math.round(recentDates.reduce((s, d) => s + (dailyCounts[d] ?? 0), 0) / recentDates.length)
          : 0

      const weekdayMeans = buildWeekdayMeans(dailyCounts)
      const forecast7    = generateForecast(latestDate, weekdayMeans, 7)

      // Build date-keyed map expected by the Langflow prompt.
      const predicted_next_7_days: Record<string, number> = {}
      for (const f of forecast7) {
        predicted_next_7_days[f.date] = f.predicted
      }

      const summary: AnalyticsSummary = {
        latest_date:        latestDate,
        total_patients:     kpis.total,
        emergency_patients: kpis.emergency,
        waiting_patients:   kpis.waiting,
        completed_patients: kpis.completed,
        average_7_days,
        predicted_next_7_days,
      }

      const result = await generateAIInsights(summary)
      setAiResult(result)
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Failed to generate AI insights')
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <p className="text-red-600 font-medium mb-1">Failed to load data</p>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    )
  }

  const latestDateLabel = latestDate
    ? new Date(latestDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—'

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Latest available data: {latestDateLabel}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total Patients"
          value={kpis?.total ?? 0}
          subtitle={`Scheduled on ${latestDateLabel}`}
          icon={<Users className="w-5 h-5" />}
          accent="blue"
        />
        <KpiCard
          title="Emergency"
          value={kpis?.emergency ?? 0}
          subtitle="Urgent priority"
          icon={<AlertTriangle className="w-5 h-5" />}
          accent="red"
        />
        <KpiCard
          title="Waiting"
          value={kpis?.waiting ?? 0}
          subtitle="Awaiting examination"
          icon={<Clock className="w-5 h-5" />}
          accent="amber"
        />
        <KpiCard
          title="Completed"
          value={kpis?.completed ?? 0}
          subtitle="Examinations done"
          icon={<CheckCircle className="w-5 h-5" />}
          accent="green"
        />
      </div>

      {/* Daily Volume Chart */}
      <Card title="Daily Patient Volume" subtitle="Examinations over the last 30 days">
        <div className="p-5">
          {dailyVolume.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">
              No data available for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={dailyVolume} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(v) => [v, 'Patients']}
                  labelFormatter={(l) => `Date: ${l}`}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#volumeGrad)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* MRI Type & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* MRI Type */}
        <Card title="MRI Type Distribution" subtitle="All-time breakdown by scan type">
          <div className="p-5">
            {mriTypes.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-slate-400">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={mriTypes} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip
                    formatter={(v) => [typeof v === 'number' ? v.toLocaleString() : v, 'Patients']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    {mriTypes.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Status Distribution */}
        <Card title="Patient Status Distribution" subtitle="All-time breakdown by status">
          <div className="p-5">
            {statuses.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-slate-400">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statuses}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {statuses.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [typeof v === 'number' ? v.toLocaleString() : v, 'Patients']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* AI Insights Section */}
      <div className="space-y-4">
        {/* Header row with generate button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">AI Analysis</h2>
            <p className="text-xs text-slate-400 mt-0.5">Powered by Langflow</p>
          </div>
          <button
            onClick={handleGenerateInsights}
            disabled={aiLoading || loading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {aiLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {aiLoading ? 'Generating…' : aiResult ? 'Regenerate' : 'Generate AI Insights'}
          </button>
        </div>

        {/* Error state */}
        {aiError && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
            <Zap className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{aiError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* AI Insights card */}
          <Card title="AI Insights" subtitle="Generated by Langflow">
            <div className="p-5">
              {aiLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analysing patient data…
                </div>
              ) : aiResult && aiResult.insights.length > 0 ? (
                <ul className="space-y-2">
                  {aiResult.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-700 leading-relaxed">{insight}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100">
                  <Lightbulb className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-700 mb-1">No insights yet</p>
                    <p className="text-xs text-blue-500 leading-relaxed">
                      Click "Generate AI Insights" to analyse today's patient data with Langflow.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Recommendations card */}
          <Card title="Operational Recommendations" subtitle="Generated by Langflow">
            <div className="p-5">
              {aiLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Building recommendations…
                </div>
              ) : aiResult && aiResult.recommendations.length > 0 ? (
                <ul className="space-y-2">
                  {aiResult.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-700 leading-relaxed">{rec}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-100">
                  <Zap className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-700 mb-1">No recommendations yet</p>
                    <p className="text-xs text-amber-500 leading-relaxed">
                      Operational recommendations will appear here after generating AI insights.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
