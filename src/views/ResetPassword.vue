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
  <div class="w-full max-w-[30rem] space-y-6 rounded-xl bg-white p-8 shadow-card">
    <header class="space-y-1">
      <h1 class="text-2xl font-extrabold text-blue-900">Nieuw wachtwoord</h1>
      <p class="text-sm text-grey-700">Kies een nieuw wachtwoord voor je account.</p>
    </header>

    <p
      v-if="!token"
      class="rounded-lg border-l-4 border-red-500 bg-yellow-100 px-4 py-3 text-sm text-red-500"
    >
      Ongeldige of ontbrekende reset-link. Vraag een nieuwe aan.
    </p>

    <p
      v-else-if="done"
      class="rounded-lg border-l-4 border-green-500 bg-green-100 px-4 py-3 text-sm text-green-800"
    >
      Je wachtwoord is bijgewerkt. Je kunt nu inloggen.
    </p>

    <form v-else class="space-y-6" @submit.prevent="onSubmit">
      <p
        v-if="error"
        class="rounded-lg border-l-4 border-red-500 bg-yellow-100 px-4 py-3 text-sm text-red-500"
        role="alert"
      >
        {{ error }}
      </p>

      <div class="space-y-4">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-grey-800">Nieuw wachtwoord</span>
          <input
            v-model="password"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
            placeholder="••••••••"
            class="w-full rounded-lg border border-grey-400 px-3 py-2.5 text-sm transition-colors placeholder:text-grey-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/30 focus:outline-none"
          />
        </label>

        <label class="block">
          <span class="mb-1 block text-sm font-medium text-grey-800">Herhaal wachtwoord</span>
          <input
            v-model="confirm"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
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
        {{ submitting ? 'Bezig…' : 'Wachtwoord opslaan' }}
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
