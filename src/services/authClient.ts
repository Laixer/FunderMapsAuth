/**
 * Better Auth client for the flows that need the browser's WebAuthn API
 * (passkeys). Everything else in this app still goes through the small fetch
 * wrapper in ./api — same endpoints, same cookie.
 *
 * The session is the Better Auth cookie on the API origin. It is SameSite=Lax,
 * and every FunderMaps app lives on a *.fundermaps.com subdomain, so the
 * browser sends it on credentialed fetches from any of them.
 */
import { createAuthClient } from 'better-auth/client'
import { passkeyClient } from '@better-auth/passkey/client'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_FUNDERMAPS_URL,
  basePath: '/api/auth',
  fetchOptions: { credentials: 'include' },
  plugins: [passkeyClient()],
})
