/**
 * Minimal fetch wrapper over the FunderMaps TS API's Better Auth endpoints.
 * Calls `${VITE_FUNDERMAPS_URL}/api/auth/<path>`. Throws an Error carrying the
 * server's message on a non-OK response.
 */

const BASE = import.meta.env.VITE_FUNDERMAPS_URL

if (!BASE) {
  // Fail loud in dev rather than firing requests at `/undefined/...`.
  console.error('VITE_FUNDERMAPS_URL is not set — copy .env.example to .env')
}

interface CallOptions {
  path: string
  method?: 'GET' | 'POST'
  body?: Record<string, unknown>
  token?: string | null
}

export async function call<T = unknown>({
  path,
  method = 'POST',
  body,
  token,
}: CallOptions): Promise<T> {
  const headers: Record<string, string> = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE}/api/auth${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  let payload: unknown = null
  const text = await res.text()
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!res.ok) {
    const message =
      (payload as { message?: string } | null)?.message ||
      (typeof payload === 'string' && payload) ||
      `Request failed (${res.status})`
    throw new Error(message)
  }

  return payload as T
}
