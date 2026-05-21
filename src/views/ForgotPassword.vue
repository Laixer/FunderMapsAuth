<script setup lang="ts">
import { ref } from 'vue'

import { requestPasswordReset } from '@/services/auth'

const email = ref('')
const submitting = ref(false)
const sent = ref(false)
const error = ref<string | null>(null)

async function onSubmit() {
  if (submitting.value) return
  submitting.value = true
  error.value = null
  try {
    await requestPasswordReset(email.value)
    sent.value = true
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Versturen mislukt'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-[30rem] space-y-6 rounded-xl bg-white p-8 shadow-card">
    <header class="space-y-1">
      <h1 class="text-2xl font-extrabold text-blue-900">Wachtwoord vergeten</h1>
      <p class="text-sm text-grey-700">We sturen je een link om een nieuw wachtwoord in te stellen.</p>
    </header>

    <p
      v-if="sent"
      class="rounded-lg border-l-4 border-green-500 bg-green-100 px-4 py-3 text-sm text-green-800"
    >
      Als er een account bestaat voor dit e-mailadres, is er een reset-link verstuurd. Controleer je
      inbox.
    </p>

    <form v-else class="space-y-6" @submit.prevent="onSubmit">
      <p
        v-if="error"
        class="rounded-lg border-l-4 border-red-500 bg-yellow-100 px-4 py-3 text-sm text-red-500"
        role="alert"
      >
        {{ error }}
      </p>

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

      <button
        type="submit"
        :disabled="submitting"
        class="flex w-full items-center justify-center rounded-lg bg-green-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-500/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {{ submitting ? 'Bezig…' : 'Verstuur reset-link' }}
      </button>
    </form>

    <RouterLink
      :to="{ name: 'login' }"
      class="block text-center text-sm text-green-700 underline-offset-2 hover:underline"
    >
      Terug naar inloggen
    </RouterLink>
  </div>
</template>
