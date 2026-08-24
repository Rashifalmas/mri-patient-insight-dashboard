import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.API_PORT ? parseInt(process.env.API_PORT) : 3001

app.use(cors({ origin: process.env.VITE_APP_ORIGIN ?? 'http://localhost:5173' }))
app.use(express.json())

// ─── GET /api/health ─────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    langflow_url_set:  !!process.env.LANGFLOW_API_URL,
    langflow_key_set:  !!process.env.LANGFLOW_API_KEY,
    langflow_flow_set: !!process.env.LANGFLOW_FLOW_ID,
  })
})

// ─── POST /api/insights ───────────────────────────────────────────────────────
// Accepts an analytics summary, forwards it to Langflow, returns structured JSON.
// The Langflow API key never leaves this server process.

app.post('/api/insights', async (req, res) => {
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

  // Extract the text output from Langflow's nested response structure.
  // Langflow wraps the model output in: outputs[0].outputs[0].results.message.text
  let outputText = ''
  try {
    const outer = raw as Record<string, unknown>
    const outputs = outer.outputs as Array<{ outputs: Array<{ results: { message: { text: string } } }> }>
    outputText = outputs[0].outputs[0].results.message.text
  } catch {
    console.error('[Langflow] Unexpected response shape:', JSON.stringify(raw).slice(0, 500))
    res.status(502).json({ error: 'Langflow response shape was unexpected.' })
    return
  }

  // The flow is expected to return a JSON block inside the text.
  // Accept both a bare JSON object and one wrapped in a markdown code fence.
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
})

app.listen(PORT, () => {
  console.log(`[API server] running on http://localhost:${PORT}`)
})
