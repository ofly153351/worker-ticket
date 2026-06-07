import axios from 'axios'

function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

function transformKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(transformKeys)
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [toCamel(k), transformKeys(v)])
    )
  }
  return obj
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  timeout: 10_000,
  headers: { Accept: 'application/json' },
})

// Unwrap { success, message, data } envelope and camelCase keys
api.interceptors.response.use(
  (res) => {
    if (res.data && typeof res.data === 'object' && 'success' in res.data) {
      res.data = transformKeys((res.data as { data: unknown }).data)
    }
    return res
  },
  (err) => {
    const status = err?.response?.status
    const msg = err?.response?.data?.message ?? err.message
    console.error(`[Hermes API] ${status ?? 'ERR'} — ${msg}`)
    return Promise.reject(err)
  }
)
