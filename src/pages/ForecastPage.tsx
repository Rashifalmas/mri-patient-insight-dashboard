import { useEffect, useState } from 'react'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'
import type { TooltipContentProps } from 'recharts/types/component/Tooltip'
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent'
import { TrendingUp, Calendar, BarChart3, AlertCircle, Info } from 'lucide-react'
import Card from '../components/ui/Card'
import { fetchLatestDate, fetchAllDailyVolume } from '../services/patientService'
import {
  buildWeekdayMeans,
  generateForecast,
  formatShortDate,
  formatLongDate,
  type ForecastPoint,
} from '../lib/forecast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChartRow {
  date: string       // ISO yyyy-mm-dd — used for lookups and ReferenceLine
  xIndex: number     // sequential 0-based position — used as numeric XAxis dataKey
  actual?: number    // historical volume (undefined for forecast rows)
  forecast?: number  // predicted volume (undefined for historical rows)
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HISTORY_DISPLAY_DAYS = 30   // how many historical days to show on chart
type Horizon = 7 | 30

// ─── Small helper components ──────────────────────────────────────────────────

function SummaryItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

// chartRows is passed in so the tooltip can look up the date by xIndex.
function makeTooltip(chartRows: ChartRow[]) {
  return function CustomTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
    if (!active || !payload || payload.length === 0) return null
    // label is the numeric xIndex; look up the corresponding ISO date
    const idx = typeof label === 'number' ? label : Number(label)
    const row = chartRows[idx]
    const displayLabel = row ? formatLongDate(row.date) : String(label)
    return (
      <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm text-xs">
        <p className="font-medium text-slate-700 mb-1">{displayLabel}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color ?? '#000' }}>
            {String(p.name)}: <span className="font-semibold">{String(p.value)}</span> patients
          </p>
        ))}
      </div>
    )
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ForecastPage() {
  const [horizon, setHorizon] = useState<Horizon>(7)
  const [chartData, setChartData] = useState<ChartRow[]>([])
  const [forecastPoints, setForecastPoints] = useState<ForecastPoint[]>([])
  const [latestDate, setLatestDate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Re-run whenever horizon changes
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)

        // 1. Fetch all data in parallel
        const [latest, dailyCounts] = await Promise.all([
          fetchLatestDate(),
          fetchAllDailyVolume(),
        ])

        if (cancelled) return

        if (!latest) throw new Error('No examination dates found in the database.')

        // Sort all historical dates strictly ascending by calendar date.
        const allDates = Object.keys(dailyCounts).sort(
          (a, b) => new Date(a).getTime() - new Date(b).getTime()
        )
        if (allDates.length === 0) throw new Error('No historical data available.')

        // 2. Build the day-of-week mean model over ALL historical data
        const weekdayMeans = buildWeekdayMeans(dailyCounts)

        // 3. Generate forecast — canonical array used by chart, table, and summary
        const forecast = generateForecast(latest, weekdayMeans, horizon)

        // 4. Build chart rows.
        //    History: last HISTORY_DISPLAY_DAYS dates that are <= latestDate.
        //    Forecast: dates strictly after latestDate (taken directly from the
        //              canonical forecast array — never re-derived here).
        const historySlice = allDates
          .filter((d) => d <= latest)
          .slice(-HISTORY_DISPLAY_DAYS)

        // Assign a sequential integer index to each row.
        // This is the only value used as the XAxis dataKey — never formatted
        // or treated as a date; dates are looked up separately by the axis/tooltip.
        const historyRows: ChartRow[] = historySlice.map((d, i) => ({
          date: d,
          xIndex: i,
          actual: dailyCounts[d],
          forecast: undefined,
        }))
        const forecastRows: ChartRow[] = forecast.map((f, i) => ({
          date: f.date,
          xIndex: historySlice.length + i,
          actual: undefined,
          forecast: f.predicted,
        }))
        const rows: ChartRow[] = [...historyRows, ...forecastRows]

        setLatestDate(latest)
        setForecastPoints(forecast)
        setChartData(rows)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to generate forecast.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [horizon])

  // ── Derived summary stats ──────────────────────────────────────────────────
  const avgPredicted =
    forecastPoints.length > 0
      ? Math.round(forecastPoints.reduce((s, p) => s + p.predicted, 0) / forecastPoints.length)
      : 0

  const peakPoint = forecastPoints.reduce<ForecastPoint | null>(
    (best, p) => (best === null || p.predicted > best.predicted ? p : best),
    null,
  )
  const troughPoint = forecastPoints.reduce<ForecastPoint | null>(
    (best, p) => (best === null || p.predicted < best.predicted ? p : best),
    null,
  )

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Building forecast…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 max-w-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 mb-0.5">Failed to load forecast</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const forecastStartDate = forecastPoints[0]?.date ?? ''
  const forecastEndDate = forecastPoints[forecastPoints.length - 1]?.date ?? ''

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Forecast</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Day-of-week mean patient volume prediction
          </p>
        </div>

        {/* Horizon toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 flex-shrink-0">
          {([7, 30] as Horizon[]).map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={[
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                horizon === h
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              {h}-Day
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <Card
        title={`${horizon}-Day Patient Volume Forecast`}
        subtitle={`Historical (last ${HISTORY_DISPLAY_DAYS} days) · Forecast starts ${forecastStartDate ? formatLongDate(forecastStartDate) : '—'}`}
      >
        <div className="p-5">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              {/*
                XAxis uses a sequential integer index (xIndex 0, 1, 2, …) so
                Recharts never reorders or deduplicates anything. Tick labels
                are derived by looking up the corresponding date from chartData
                at that index position.
              */}
              <XAxis
                dataKey="xIndex"
                type="number"
                domain={[0, chartData.length - 1]}
                ticks={chartData
                  .filter((_, i) => i % Math.max(1, Math.floor(chartData.length / 8)) === 0)
                  .map(r => r.xIndex)}
                tickFormatter={(idx: number) =>
                  chartData[idx] ? formatShortDate(chartData[idx].date) : ''
                }
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={makeTooltip(chartData)} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              />

              {/* Vertical line at the last actual date — separates history from forecast */}
              {latestDate && chartData.find(r => r.date === latestDate) && (
                <ReferenceLine
                  x={chartData.find(r => r.date === latestDate)!.xIndex}
                  stroke="#94a3b8"
                  strokeDasharray="4 3"
                  label={{ value: 'Forecast →', position: 'insideTopRight', fontSize: 10, fill: '#64748b' }}
                />
              )}

              <Line
                type="monotone"
                dataKey="actual"
                name="Actual"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                name="Forecast"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Summary + Model Info side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Forecast Summary — spans 2 cols */}
        <Card title="Forecast Summary" className="lg:col-span-2">
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-5">
            <SummaryItem
              label="Latest data date"
              value={latestDate ? formatLongDate(latestDate) : '—'}
            />
            <SummaryItem
              label="Forecast horizon"
              value={`${horizon} days`}
            />
            <SummaryItem
              label="Forecast period"
              value={
                forecastStartDate && forecastEndDate
                  ? `${formatShortDate(forecastStartDate)} – ${formatShortDate(forecastEndDate)}`
                  : '—'
              }
            />
            <SummaryItem
              label="Avg predicted / day"
              value={`${avgPredicted} patients`}
            />
            <SummaryItem
              label="Peak day"
              value={peakPoint ? `${peakPoint.weekday} (${formatShortDate(peakPoint.date)})` : '—'}
            />
            <SummaryItem
              label="Peak volume"
              value={peakPoint ? `${peakPoint.predicted} patients` : '—'}
            />
            <SummaryItem
              label="Quietest day"
              value={troughPoint ? `${troughPoint.weekday} (${formatShortDate(troughPoint.date)})` : '—'}
            />
            <SummaryItem
              label="Quietest volume"
              value={troughPoint ? `${troughPoint.predicted} patients` : '—'}
            />
          </div>
        </Card>

        {/* Model Info */}
        <Card title="Model Information">
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-2.5">
              <BarChart3 className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-700">Model</p>
                <p className="text-xs text-slate-500 mt-0.5">Day-of-Week Mean</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <TrendingUp className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-700">Evaluation</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  MAE ≈ <span className="font-medium text-slate-700">2.28</span> patients/day
                  <br />(time-based train/test split)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-700">How it works</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Each future date is predicted using the historical average patient volume
                  for that date's day of week (Mon–Sun), calculated from all available
                  examination records.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This is a statistical baseline model, not an AI or machine learning system.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Forecast table */}
      <Card title="Forecast Detail" subtitle="Predicted daily patient volume">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Day', 'Date', 'Weekday', 'Predicted Patients'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {forecastPoints.map((p, i) => (
                <tr key={p.date} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-500 text-xs">Day {i + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{formatLongDate(p.date)}</td>
                  <td className="px-4 py-3 text-slate-600">{p.weekday}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-amber-600">{p.predicted}</span>
                      <div
                        className="h-1.5 rounded-full bg-amber-200"
                        style={{
                          width: `${Math.min(100, (p.predicted / (peakPoint?.predicted || 1)) * 80)}px`,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
