export interface AIInsightsResult {
  insights: string[]
  recommendations: string[]
}

export interface AnalyticsSummary {
  latest_date: string
  total_patients: number
  emergency_patients: number
  waiting_patients: number
  completed_patients: number
  average_7_days: number
  predicted_next_7_days: Record<string, number>
}

/**
 * Sends a compact analytics summary to the server-side /api/insights route,
 * which forwards it to Langflow and returns structured insights + recommendations.
 * The Langflow API key is never present in this client-side code.
 */
export async function generateAIInsights(
  summary: AnalyticsSummary
): Promise<AIInsightsResult> {
  const res = await fetch('/api/insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(summary),
  })

  if (!res.ok) {
    let message = `Server error ${res.status}`
    try {
      const body = await res.json() as { error?: string }
      if (body.error) message = body.error
    } catch { /* ignore */ }
    throw new Error(message)
  }

  return res.json() as Promise<AIInsightsResult>
}
