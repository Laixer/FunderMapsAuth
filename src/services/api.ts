/**
 * Minimal fetch wrapper over the FunderMaps TS API's Better Auth endpoints.
 * Calls `${VITE_FUNDERMAPS_URL}/api/auth/<path>`. Throws an Error carrying the
 * message to show on a non-OK response: Dutch for the answers we know, the
 * server's own message otherwise.
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
}

/**
 * Better Auth answers in English; the pages around it are Dutch. These are the
 * answers a visitor can run into on the login and reset forms, by error code.
 * Anything not listed keeps the server's own message.
 */
const MESSAGES = new Map<string, string>([
  ['INVALID_EMAIL_OR_PASSWORD', 'Onjuist e-mailadres of wachtwoord'],
  ['INVALID_EMAIL', 'Vul een geldig e-mailadres in'],
  ['INVALID_TOKEN', 'Deze reset-link is ongeldig of verlopen. Vraag een nieuwe aan.'],
  ['PASSWORD_TOO_SHORT', 'Het wachtwoord is te kort. Gebruik minimaal 8 tekens.'],
  ['PASSWORD_TOO_LONG', 'Het wachtwoord is te lang'],
])

const TOO_MANY_REQUESTS = 'Te veel pogingen. Wacht even en probeer het opnieuw.'

export async function call<T = unknown>({
  path,
  method = 'POST',
  body,
}: CallOptions): Promise<T> {
  const headers: Record<string, string> = {}
  if (body) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}/api/auth${path}`, {
    method,
    headers,
    // The Better Auth session cookie is the session. Sign-in sets it on the
    // API origin; every FunderMaps app sends it back on credentialed fetches
    // (same-site). Requires credentialed CORS on the API.
    credentials: 'include',
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
    const answer = payload as { message?: string; code?: string } | null
    const message =
      (typeof answer?.code === 'string' && MESSAGES.get(answer.code)) ||
      (res.status === 429 && TOO_MANY_REQUESTS) ||
      answer?.message ||
      (typeof payload === 'string' && payload) ||
      `Verzoek mislukt (${res.status})`
    throw new Error(message)
  }

  return payload as T
}
