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
  <div class="flex flex-col gap-4">
    <h2 class="text-lg font-medium">Wachtwoord vergeten</h2>

    <p v-if="sent" class="text-sm text-green-700">
      Als er een account bestaat voor dit e-mailadres, is er een reset-link verstuurd.
      Controleer je inbox.
    </p>

    <form v-else class="flex flex-col gap-4" @submit.prevent="onSubmit">
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

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <button
        type="submit"
        :disabled="submitting"
        class="rounded-sm bg-gray-800 px-3 py-2 text-white disabled:opacity-50"
      >
        {{ submitting ? 'Bezig…' : 'Verstuur reset-link' }}
      </button>
    </form>

    <RouterLink :to="{ name: 'login' }" class="text-sm text-blue-700 underline">
      Terug naar inloggen
    </RouterLink>
  </div>
</template>
