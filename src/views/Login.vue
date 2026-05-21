<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { login } from '@/services/auth'

const router = useRouter()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)

const API = import.meta.env.VITE_FUNDERMAPS_URL

async function onSubmit() {
  if (submitting.value) return
  submitting.value = true
  error.value = null
  try {
    await login(email.value, password.value)
    // OIDC resume: the provider redirects unauthenticated users here with the
    // full authorization request (incl. its `sig`) in the query string. After
    // login the session cookie is set, so we replay that exact query string
    // back to /oauth2/authorize — the provider verifies the signature and
    // (for trusted, skip_consent clients) issues the code and returns the user
    // to the requesting app. If there's no client_id we just came here to log
    // in, so show the landing page.
    const search = window.location.search
    if (new URLSearchParams(search).has('client_id')) {
      window.location.assign(`${API}/api/auth/oauth2/authorize${search}`)
      return
    }
    router.push({ name: 'home' })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Inloggen mislukt'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="w-full max-w-[30rem] space-y-6 rounded-xl bg-white p-8 shadow-card" @submit.prevent="onSubmit">
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
          autocomplete="username"
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

    <RouterLink
      :to="{ name: 'forgot-password' }"
      class="block text-center text-sm text-green-700 underline-offset-2 hover:underline"
    >
      Wachtwoord vergeten?
    </RouterLink>
  </form>
</template>
