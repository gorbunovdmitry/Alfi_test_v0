import { defineConfig, loadEnv } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import react from '@vitejs/plugin-react'

const AITUNNEL_URL = 'https://api.aitunnel.ru/v1/chat/completions'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Loads ALL env vars (incl. non-VITE_ ones) into the dev server only — the key
  // never reaches the client bundle.
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.AITUNNEL_API_KEY || ''
  const defaultModel = env.AITUNNEL_MODEL || 'gpt-5.4-nano'

  return {
    // GitHub Pages serves the project under /Alfi_test_v0/; dev stays at root.
    base: mode === 'production' ? '/Alfi_test_v0/' : '/',
    plugins: [
      react(),
      {
        name: 'aitunnel-chat-proxy',
        configureServer(server) {
          server.middlewares.use('/api/chat', (req: IncomingMessage, res: ServerResponse) => {
            const json = (status: number, obj: unknown) => {
              res.statusCode = status
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify(obj))
            }
            if (req.method !== 'POST') return json(405, { error: 'METHOD_NOT_ALLOWED' })
            if (!apiKey) return json(503, { error: 'NO_API_KEY', message: 'Задайте AITUNNEL_API_KEY в .env.local' })

            const chunks: Buffer[] = []
            req.on('data', (c: Buffer) => chunks.push(c))
            req.on('end', async () => {
              try {
                const body = JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}')
                const upstream = await fetch(AITUNNEL_URL, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                  },
                  body: JSON.stringify({
                    model: body.model || defaultModel,
                    messages: body.messages ?? [],
                    max_completion_tokens: body.max_completion_tokens ?? 900,
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
        },
      },
    ],
  }
})
