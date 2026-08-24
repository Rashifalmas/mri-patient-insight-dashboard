/**
 * Day-of-Week Mean Forecasting Model
 *
 * For each future date, the predicted patient volume is the historical mean
 * of all past dates that fall on the same weekday (0 = Sunday … 6 = Saturday).
 *
 * Model evaluation (Python, time-based train/test split):
 *   MAE ≈ 2.28 patients/day
 */

export interface ForecastPoint {
  date: string          // ISO yyyy-mm-dd
  predicted: number     // rounded to nearest integer
  weekday: string       // e.g. "Monday"
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * Parse a yyyy-mm-dd string as a local date (no UTC shift).
 */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Format a Date as yyyy-mm-dd in local time.
 */
function toISOLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Build per-weekday mean volumes from a daily-count map.
 * Returns an array indexed 0–6 (Sunday–Saturday).
 */
export function buildWeekdayMeans(dailyCounts: Record<string, number>): number[] {
  const sums = [0, 0, 0, 0, 0, 0, 0]
  const counts = [0, 0, 0, 0, 0, 0, 0]

  for (const [dateStr, volume] of Object.entries(dailyCounts)) {
    if (!dateStr || typeof volume !== 'number') continue
    const dow = parseLocalDate(dateStr).getDay()   // 0 = Sun
    sums[dow] += volume
    counts[dow] += 1
  }

  return sums.map((s, i) => (counts[i] > 0 ? s / counts[i] : 0))
}

/**
 * Generate a forecast for `horizonDays` days starting the day after `latestDate`.
 */
export function generateForecast(
  latestDate: string,
  weekdayMeans: number[],
  horizonDays: number,
): ForecastPoint[] {
  const result: ForecastPoint[] = []
  const start = parseLocalDate(latestDate)

  for (let i = 1; i <= horizonDays; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const dow = d.getDay()
    result.push({
      date: toISOLocal(d),
      predicted: Math.round(weekdayMeans[dow]),
      weekday: WEEKDAY_NAMES[dow],
    })
  }

  return result
}

/**
 * Format a yyyy-mm-dd string for display (e.g. "Aug 24").
 */
export function formatShortDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Format a yyyy-mm-dd string for long display (e.g. "Sunday, August 24, 2026").
 */
export function formatLongDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}
