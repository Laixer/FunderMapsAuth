/**
 * Better Auth flows used by the auth app. These are the same endpoints the
 * other FunderMaps frontends call; this app is the dedicated UI for them.
 *
 * The bearer token returned by sign-in is stored locally so the post-login
 * screen can show who's signed in and offer sign-out. The OIDC-redirect glue
 * (resuming an /authorize request after login) is added in the pilot phase.
 */
import { call } from './api'

const TOKEN_KEY = 'access_token'

export interface SessionUser {
  id: string
  email: string
  role?: string
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

interface SignInResponse {
  token: string
  user: SessionUser
}

export async function login(email: string, password: string): Promise<SignInResponse> {
  const res = await call<SignInResponse>({
    path: '/sign-in/email',
    body: { email, password },
  })
  if (res?.token) setToken(res.token)
  return res
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
  await call({
    path: '/reset-password',
    body: { token, newPassword },
  })
}

interface SessionResponse {
  session: { token: string; expiresAt: string; userId: string }
  user: SessionUser
}

export async function getSession(): Promise<SessionResponse | null> {
  const token = getToken()
  if (!token) return null
  try {
    return await call<SessionResponse>({ path: '/get-session', method: 'GET', token })
  } catch {
    clearToken()
    return null
  }
}

export async function signOut(): Promise<void> {
  const token = getToken()
  if (token) {
    try {
      await call({ path: '/sign-out', token })
    } catch {
      // best-effort server-side revoke; always clear locally
    }
  }
  clearToken()
}
