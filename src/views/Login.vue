<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { login, loginWithPasskey, safeRedirect } from '@/services/auth'

const router = useRouter()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const passkeyBusy = ref(false)
const error = ref<string | null>(null)

const API = import.meta.env.VITE_FUNDERMAPS_URL

/**
 * Where to go once the cookie is set.
 *  - `client_id` in the query: an OIDC authorization request parked here by
 *    the provider; replay it (kept until the last app has moved to cookies).
 *  - `redirect`: the app that sent the user here; FunderMaps origins only.
 *  - otherwise the account page.
 */
function continueAfterLogin() {
  const params = new URLSearchParams(window.location.search)
  if (params.has('client_id')) {
    window.location.assign(`${API}/api/auth/oauth2/authorize${window.location.search}`)
    return
  }
  const target = safeRedirect(params.get('redirect'))
  if (target) {
    window.location.assign(target)
    return
  }
  router.push({ name: 'home' })
}

async function onSubmit() {
  if (submitting.value) return
  submitting.value = true
  error.value = null
  try {
    await login(email.value, password.value)
    continueAfterLogin()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Inloggen mislukt'
  } finally {
    submitting.value = false
  }
}

async function onPasskey() {
  if (passkeyBusy.value) return
  passkeyBusy.value = true
  error.value = null
  try {
    if (await loginWithPasskey()) continueAfterLogin()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Inloggen met passkey mislukt'
  } finally {
    passkeyBusy.value = false
  }
}

const passkeysSupported = ref(false)

onMounted(async () => {
  passkeysSupported.value = typeof window.PublicKeyCredential !== 'undefined'
  if (!passkeysSupported.value) return
  // Conditional UI: the browser lists the user's passkeys for this site in the
  // e-mail field's autocomplete (autocomplete="username webauthn"). Resolves
  // only when one is picked; a password submit simply supersedes it.
  try {
    const available = await window.PublicKeyCredential.isConditionalMediationAvailable?.()
    if (available && (await loginWithPasskey({ autoFill: true }))) continueAfterLogin()
  } catch {
    // no conditional UI, or the user went on with a password
  }
})
</script>

<template>
  <form class="w-[calc(100vw-3rem)] sm:w-[30rem] space-y-6 rounded-xl bg-white p-8 shadow-card" @submit.prevent="onSubmit">
    <header class="space-y-1">
      <h1 class="text-2xl font-extrabold text-blue-900">Inloggen</h1>
      <p class="text-sm text-grey-700">Welkom terug bij FunderMaps.</p>
    </header>

    <p
      v-if="error"
      class="rounded-lg border-l-4 border-red-500 bg-yellow-100 px-4 py-3 text-sm text-red-500"
      role="alert"
    >
      {{ error }}
    </p>

    <div class="space-y-4">
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-grey-800">E-mailadres</span>
        <input
          v-model="email"
          type="email"
          autocomplete="username webauthn"
          required
          placeholder="naam@bedrijf.nl"
          class="w-full rounded-lg border border-grey-400 px-3 py-2.5 text-sm transition-colors placeholder:text-grey-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/30 focus:outline-none"
        />
      </label>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-grey-800">Wachtwoord</span>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          placeholder="••••••••"
          class="w-full rounded-lg border border-grey-400 px-3 py-2.5 text-sm transition-colors placeholder:text-grey-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/30 focus:outline-none"
        />
      </label>
    </div>

    <button
      type="submit"
      :disabled="submitting"
      class="flex w-full items-center justify-center rounded-lg bg-green-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-500/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      {{ submitting ? 'Bezig…' : 'Inloggen' }}
    </button>

    <button
      v-if="passkeysSupported"
      type="button"
      :disabled="passkeyBusy"
      class="flex w-full items-center justify-center gap-2 rounded-lg border border-grey-400 px-4 py-2.5 text-sm font-semibold text-grey-800 transition-colors hover:border-green-500 hover:text-green-700 focus:ring-2 focus:ring-green-500/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      @click="onPasskey"
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="9" cy="8" r="4" />
        <path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 3.2.9" />
        <circle cx="18" cy="14" r="3" />
        <path d="M18 17v5l2-2" />
      </svg>
      {{ passkeyBusy ? 'Bezig…' : 'Inloggen met passkey' }}
    </button>

    <RouterLink
      :to="{ name: 'forgot-password' }"
      class="block text-center text-sm text-green-700 underline-offset-2 hover:underline"
    >
      Wachtwoord vergeten?
    </RouterLink>
  </form>
</template>
