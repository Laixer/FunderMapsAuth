<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { resetPassword } from '@/services/auth'

const route = useRoute()

// The API redirects the email link back here with ?token=<valid_token>.
const token = computed(() => {
  const t = route.query.token
  return typeof t === 'string' ? t : ''
})

const password = ref('')
const confirm = ref('')
const submitting = ref(false)
const done = ref(false)
const error = ref<string | null>(null)

async function onSubmit() {
  if (submitting.value) return
  error.value = null

  if (password.value !== confirm.value) {
    error.value = 'Wachtwoorden komen niet overeen'
    return
  }

  submitting.value = true
  try {
    await resetPassword(token.value, password.value)
    done.value = true
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Resetten mislukt'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <h2 class="text-lg font-medium">Nieuw wachtwoord instellen</h2>

    <p v-if="!token" class="text-sm text-red-600">
      Ongeldige of ontbrekende reset-link. Vraag een nieuwe aan.
    </p>

    <p v-else-if="done" class="text-sm text-green-700">
      Je wachtwoord is bijgewerkt. Je kunt nu inloggen.
    </p>

    <form v-else class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <label class="flex flex-col gap-1">
        <span class="text-sm">Nieuw wachtwoord</span>
        <input
          v-model="password"
          type="password"
          autocomplete="new-password"
          required
          minlength="8"
          class="rounded-sm border border-gray-400 px-3 py-2"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-sm">Herhaal wachtwoord</span>
        <input
          v-model="confirm"
          type="password"
          autocomplete="new-password"
          required
          minlength="8"
          class="rounded-sm border border-gray-400 px-3 py-2"
        />
      </label>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <button
        type="submit"
        :disabled="submitting"
        class="rounded-sm bg-gray-800 px-3 py-2 text-white disabled:opacity-50"
      >
        {{ submitting ? 'Bezig…' : 'Wachtwoord opslaan' }}
      </button>
    </form>

    <RouterLink :to="{ name: 'login' }" class="text-sm text-blue-700 underline">
      Terug naar inloggen
    </RouterLink>
  </div>
</template>
