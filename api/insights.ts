import type { VercelRequest, VercelResponse } from '@vercel/node'

// Vercel serverless handler for POST /api/insights.
// Receives a compact MRI analytics summary, forwards it to Langflow,
// parses the structured response, and returns { insights, recommendations }.
// The Langflow API key is only ever read from server-side environment variables.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' })
    return
  }

  const langflowUrl  = process.env.LANGFLOW_API_URL
  const langflowKey  = process.env.LANGFLOW_API_KEY
  const langflowFlow = process.env.LANGFLOW_FLOW_ID

  if (!langflowUrl || !langflowKey || !langflowFlow) {
    res.status(503).json({
      error: 'Langflow is not configured. Set LANGFLOW_API_URL, LANGFLOW_API_KEY, and LANGFLOW_FLOW_ID.',
    })
    return
  }

  const summary = req.body
  if (!summary || typeof summary !== 'object') {
    res.status(400).json({ error: 'Request body must be a JSON analytics summary object.' })
    return
  }

  let langflowRes: Response
  try {
    langflowRes = await fetch(
      `${langflowUrl}/api/v1/run/${langflowFlow}?stream=false`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': langflowKey,
        },
        body: JSON.stringify({
          input_value: JSON.stringify(summary),
          input_type: 'chat',
          output_type: 'chat',
        }),
      }
    )
  } catch (err) {
    console.error('[Langflow] Network error:', err)
    res.status(502).json({ error: 'Could not reach the Langflow API. Check LANGFLOW_API_URL.' })
    return
  }

  if (!langflowRes.ok) {
    const text = await langflowRes.text().catch(() => '')
    console.error('[Langflow] HTTP error:', langflowRes.status, text)
    res.status(502).json({ error: `Langflow returned HTTP ${langflowRes.status}.` })
    return
  }

  let raw: unknown
  try {
    raw = await langflowRes.json()
  } catch {
    res.status(502).json({ error: 'Langflow response was not valid JSON.' })
    return
  }

  // Extract text output from Langflow's nested response structure:
  // outputs[0].outputs[0].results.message.text
  let outputText = ''
  try {
    const outer = raw as Record<string, unknown>
    const outputs = outer.outputs as Array<{
      outputs: Array<{ results: { message: { text: string } } }>
    }>
    outputText = outputs[0].outputs[0].results.message.text
  } catch {
    console.error('[Langflow] Unexpected response shape:', JSON.stringify(raw).slice(0, 500))
    res.status(502).json({ error: 'Langflow response shape was unexpected.' })
    return
  }

  // Accept JSON either bare or wrapped in a markdown code fence.
  const jsonMatch = outputText.match(/```(?:json)?\s*([\s\S]*?)```/) ?? null
  const jsonStr   = jsonMatch ? jsonMatch[1].trim() : outputText.trim()

  let parsed: { insights?: unknown; recommendations?: unknown }
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    console.error('[Langflow] Could not parse JSON from output:', outputText.slice(0, 500))
    res.status(502).json({ error: 'Langflow output was not parseable JSON.' })
    return
  }

  const insights        = Array.isArray(parsed.insights)        ? (parsed.insights as string[])        : []
  const recommendations = Array.isArray(parsed.recommendations) ? (parsed.recommendations as string[]) : []

  res.json({ insights, recommendations })
}
