<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { login } from '@/services/auth'

const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)

async function onSubmit() {
  if (submitting.value) return
  submitting.value = true
  error.value = null
  try {
    await login(email.value, password.value)
    // Phase B will resume an OIDC /authorize request here. For now: if a
    // `redirect` query param is present, honour it; otherwise show the
    // signed-in landing page.
    const redirect = route.query.redirect
    if (typeof redirect === 'string' && redirect) {
      window.location.assign(redirect)
    } else {
      router.push({ name: 'home' })
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Inloggen mislukt'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <h2 class="text-lg font-medium">Inloggen</h2>

    <label class="flex flex-col gap-1">
      <span class="text-sm">E-mailadres</span>
      <input
        v-model="email"
        type="email"
        autocomplete="username"
        required
        class="rounded-sm border border-gray-400 px-3 py-2"
      />
    </label>

    <label class="flex flex-col gap-1">
      <span class="text-sm">Wachtwoord</span>
      <input
        v-model="password"
        type="password"
        autocomplete="current-password"
        required
        class="rounded-sm border border-gray-400 px-3 py-2"
      />
    </label>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <button
      type="submit"
      :disabled="submitting"
      class="rounded-sm bg-gray-800 px-3 py-2 text-white disabled:opacity-50"
    >
      {{ submitting ? 'Bezig…' : 'Inloggen' }}
    </button>

    <RouterLink :to="{ name: 'forgot-password' }" class="text-sm text-blue-700 underline">
      Wachtwoord vergeten?
    </RouterLink>
  </form>
</template>
