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
  <div class="flex flex-col gap-4">
    <p v-if="loading" class="text-sm">Laden…</p>
    <template v-else>
      <h2 class="text-lg font-medium">Ingelogd</h2>
      <p class="text-sm">
        {{ user?.email }}<span v-if="user?.role"> — {{ user.role }}</span>
      </p>
      <button
        type="button"
        class="rounded-sm bg-gray-800 px-3 py-2 text-white"
        @click="onSignOut"
      >
        Uitloggen
      </button>
    </template>
  </div>
</template>
