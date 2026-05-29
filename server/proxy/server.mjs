// Альфи chat proxy — holds the AITUNNEL key server-side and forwards to gpt-5.4-nano.
// Isolated service; no dependency on anything else on the host.
import http from 'node:http'

const PORT = Number(process.env.PORT) || 8090
const AITUNNEL_URL = 'https://api.aitunnel.ru/v1/chat/completions'
const API_KEY = process.env.AITUNNEL_API_KEY || ''
const MODEL = process.env.AITUNNEL_MODEL || 'gpt-5.4-nano'
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*'

function setCors(res, origin) {
  const allow = ALLOWED_ORIGIN === '*' ? origin || '*' : ALLOWED_ORIGIN
  res.setHeader('Access-Control-Allow-Origin', allow)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

const server = http.createServer((req, res) => {
  setCors(res, req.headers.origin)
  const json = (status, obj) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(obj))
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  if (req.url === '/health') return json(200, { ok: true })
  if (req.url !== '/api/chat') return json(404, { error: 'NOT_FOUND' })
  if (req.method !== 'POST') return json(405, { error: 'METHOD_NOT_ALLOWED' })
  if (!API_KEY) return json(503, { error: 'NO_API_KEY' })

  const chunks = []
  req.on('data', (c) => chunks.push(c))
  req.on('end', async () => {
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}')
      const upstream = await fetch(AITUNNEL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({
          model: body.model || MODEL,
          messages: body.messages ?? [],
          max_completion_tokens: body.max_completion_tokens ?? 1000,
          ...(body.reasoning_effort ? { reasoning_effort: body.reasoning_effort } : {}),
        }),
      })
      const text = await upstream.text()
      res.statusCode = upstream.status
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(text)
    } catch (e) {
      json(502, { error: 'PROXY_ERROR', message: String(e) })
    }
  })
})

server.listen(PORT, () => console.log(`alfi chat proxy listening on :${PORT}`))
