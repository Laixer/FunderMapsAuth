/**
 * Better Auth flows used by the auth app. These are the same endpoints the
 * other FunderMaps frontends call; this app is the dedicated UI for them.
 *
 * Sessions live in the Better Auth cookie on the API origin; nothing is stored
 * in this app. After a sign-in the caller is sent back to the app it came from
 * (`?redirect=`), which then sees the cookie on its own API calls.
 */
import { call } from './api'
import { authClient } from './authClient'

export interface SessionUser {
  id: string
  email: string
  name?: string | null
  role?: string
}

interface SessionResponse {
  session: { expiresAt: string; userId: string }
  user: SessionUser
}

export async function login(email: string, password: string): Promise<void> {
  await call({ path: '/sign-in/email', body: { email, password } })
}

/**
 * Passkey sign-in. `autoFill: true` arms the browser's conditional UI: the
 * passkey appears in the autocomplete of an input with autocomplete="webauthn"
 * and resolves when the user picks it. Without it the browser prompts at once.
 */
export async function loginWithPasskey(opts: { autoFill?: boolean } = {}): Promise<boolean> {
  const res = await authClient.signIn.passkey(opts)
  if (res?.error) {
    // The user dismissed the prompt, or autofill was cancelled by a
    // password submit; neither is an error worth showing.
    if (res.error.status === 0 || /abort|cancel|NotAllowed/i.test(res.error.message ?? '')) return false
    throw new Error(res.error.message ?? 'Inloggen met passkey mislukt')
  }
  return !!res?.data
}

export async function getSession(): Promise<SessionResponse | null> {
  try {
    const res = await call<SessionResponse | null>({ path: '/get-session', method: 'GET' })
    return res?.user ? res : null
  } catch {
    return null
  }
}

export async function signOut(): Promise<void> {
  try {
    await call({ path: '/sign-out' })
  } catch {
    // best-effort; the cookie is cleared by the server on success
  }
}

/**
 * Request a password-reset email. `redirectTo` must be an origin the API
 * trusts (TRUSTED_ORIGINS); after the user clicks the email link the API
 * sends them back here with `?token=`.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await call({
    path: '/request-password-reset',
    body: { email, redirectTo: `${window.location.origin}/reset-password` },
  })
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await call({ path: '/reset-password', body: { token, newPassword } })
}

// ---- where to go after signing in ------------------------------------------

/**
 * Only FunderMaps origins may be redirect targets: the login page must not be
 * usable as an open redirector. Same-origin paths are fine too.
 */
export function safeRedirect(raw: string | null | undefined): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw, window.location.origin)
    const own = url.origin === window.location.origin
    const fundermaps = url.protocol === 'https:' && /(^|\.)fundermaps\.com$/.test(url.hostname)
    const dev = import.meta.env.DEV && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    return own || fundermaps || dev ? url.toString() : null
  } catch {
    return null
  }
}

export interface Passkey {
  id: string
  name?: string | null
  deviceType: string
  backedUp: boolean
  createdAt?: string | Date | null
}

export async function listPasskeys(): Promise<Passkey[]> {
  const res = await authClient.passkey.listUserPasskeys()
  if (res.error) throw new Error(res.error.message ?? 'Passkeys ophalen mislukt')
  return (res.data ?? []) as Passkey[]
}

export async function addPasskey(name: string): Promise<void> {
  const res = await authClient.passkey.addPasskey({ name })
  if (res?.error) throw new Error(res.error.message ?? 'Passkey toevoegen mislukt')
}

export async function deletePasskey(id: string): Promise<void> {
  const res = await authClient.passkey.deletePasskey({ id })
  if (res.error) throw new Error(res.error.message ?? 'Passkey verwijderen mislukt')
}
