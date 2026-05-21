<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { getSession, signOut, type SessionUser } from '@/services/auth'

const router = useRouter()

const user = ref<SessionUser | null>(null)
const loading = ref(true)

onMounted(async () => {
  const session = await getSession()
  if (!session) {
    router.push({ name: 'login' })
    return
  }
  user.value = session.user
  loading.value = false
})

async function onSignOut() {
  await signOut()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="w-full max-w-[30rem] space-y-6 rounded-xl bg-white p-8 shadow-card">
    <p v-if="loading" class="text-sm text-grey-700">Laden…</p>
    <template v-else>
      <header class="space-y-1">
        <h1 class="text-2xl font-extrabold text-blue-900">Ingelogd</h1>
        <p class="text-sm text-grey-700">Je bent aangemeld bij FunderMaps.</p>
      </header>

      <div class="rounded-lg bg-grey-100 px-4 py-3 text-sm">
        <p class="font-medium text-grey-800">{{ user?.email }}</p>
        <p v-if="user?.role" class="text-grey-700">{{ user.role }}</p>
      </div>

      <button
        type="button"
        class="flex w-full items-center justify-center rounded-lg border border-grey-400 px-4 py-2.5 text-sm font-semibold text-grey-800 transition-colors hover:border-red-500 hover:bg-red-50 hover:text-red-500 focus:ring-2 focus:ring-green-500/40 focus:outline-none"
        @click="onSignOut"
      >
        Uitloggen
      </button>
    </template>
  </div>
</template>
