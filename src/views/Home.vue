<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  addPasskey,
  deletePasskey,
  getSession,
  listPasskeys,
  signOut,
  type Passkey,
  type SessionUser,
} from '@/services/auth'

const router = useRouter()

const user = ref<SessionUser | null>(null)
const loading = ref(true)
const passkeys = ref<Passkey[]>([])
const passkeyError = ref<string | null>(null)
const busy = ref(false)
const passkeysSupported = typeof window !== 'undefined' && typeof window.PublicKeyCredential !== 'undefined'

const apps = [
  { name: 'Kaart', href: 'https://maps.fundermaps.com', blurb: 'Funderingsrisico per pand' },
  { name: 'Data Studio', href: 'https://studio.fundermaps.com', blurb: 'Invoer en beoordeling' },
  { name: 'Beheer', href: 'https://admin.fundermaps.com', blurb: 'Gebruikers en organisaties' },
]

async function refreshPasskeys() {
  try {
    passkeys.value = await listPasskeys()
  } catch (e) {
    passkeyError.value = e instanceof Error ? e.message : 'Passkeys ophalen mislukt'
  }
}

onMounted(async () => {
  const session = await getSession()
  if (!session) {
    router.push({ name: 'login' })
    return
  }
  user.value = session.user
  loading.value = false
  if (passkeysSupported) await refreshPasskeys()
})

function defaultPasskeyName(): string {
  const ua = navigator.userAgent
  if (/iPhone|iPad/.test(ua)) return 'iPhone of iPad'
  if (/Macintosh/.test(ua)) return 'Mac'
  if (/Android/.test(ua)) return 'Android-toestel'
  if (/Windows/.test(ua)) return 'Windows-pc'
  return 'Dit apparaat'
}

async function onAddPasskey() {
  if (busy.value) return
  const name = window.prompt('Naam voor deze passkey', defaultPasskeyName())
  if (name === null) return
  busy.value = true
  passkeyError.value = null
  try {
    await addPasskey(name.trim() || defaultPasskeyName())
    await refreshPasskeys()
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    // Dismissing the browser prompt is not an error.
    if (!/abort|cancel|NotAllowed/i.test(msg)) passkeyError.value = msg || 'Passkey toevoegen mislukt'
  } finally {
    busy.value = false
  }
}

async function onDeletePasskey(pk: Passkey) {
  if (busy.value) return
  if (!window.confirm(`Passkey "${pk.name || 'zonder naam'}" verwijderen?`)) return
  busy.value = true
  passkeyError.value = null
  try {
    await deletePasskey(pk.id)
    await refreshPasskeys()
  } catch (e) {
    passkeyError.value = e instanceof Error ? e.message : 'Passkey verwijderen mislukt'
  } finally {
    busy.value = false
  }
}

function formatDate(d: Passkey['createdAt']): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function onSignOut() {
  await signOut()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="w-[calc(100vw-3rem)] sm:w-[30rem] space-y-6 rounded-xl bg-white p-8 shadow-card">
    <p v-if="loading" class="text-sm text-grey-700">Laden…</p>
    <template v-else>
      <header class="space-y-1">
        <h1 class="text-2xl font-extrabold text-blue-900">Ingelogd</h1>
        <p class="text-sm text-grey-700">Je bent aangemeld bij FunderMaps als <span class="font-medium text-grey-800">{{ user?.email }}</span>.</p>
      </header>

      <section class="space-y-2">
        <h2 class="text-xs font-semibold uppercase tracking-wide text-grey-700">Ga verder naar</h2>
        <ul class="divide-y divide-grey-200 rounded-lg border border-grey-200">
          <li v-for="app in apps" :key="app.href">
            <a :href="app.href" class="flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-grey-100">
              <span>
                <span class="block font-medium text-grey-800">{{ app.name }}</span>
                <span class="block text-grey-700">{{ app.blurb }}</span>
              </span>
              <span aria-hidden="true" class="text-grey-400">→</span>
            </a>
          </li>
        </ul>
      </section>

      <section v-if="passkeysSupported" class="space-y-2">
        <div class="flex items-baseline justify-between">
          <h2 class="text-xs font-semibold uppercase tracking-wide text-grey-700">Passkeys</h2>
          <button
            type="button"
            :disabled="busy"
            class="text-sm font-semibold text-green-700 underline-offset-2 hover:underline disabled:opacity-50"
            @click="onAddPasskey"
          >
            + Passkey toevoegen
          </button>
        </div>
        <p class="text-sm text-grey-700">
          Log in met je vingerafdruk, gezicht of apparaatcode in plaats van een wachtwoord. Een passkey werkt op alle FunderMaps-apps.
        </p>
        <p v-if="passkeyError" class="rounded-lg border-l-4 border-red-500 bg-yellow-100 px-4 py-3 text-sm text-red-500" role="alert">
          {{ passkeyError }}
        </p>
        <ul v-if="passkeys.length" class="divide-y divide-grey-200 rounded-lg border border-grey-200">
          <li v-for="pk in passkeys" :key="pk.id" class="flex items-center justify-between px-4 py-3 text-sm">
            <span>
              <span class="block font-medium text-grey-800">{{ pk.name || 'Passkey' }}</span>
              <span class="block text-grey-700">
                {{ pk.deviceType === 'multiDevice' ? 'Gesynchroniseerd' : 'Alleen dit apparaat' }}
                <template v-if="pk.createdAt"> · toegevoegd {{ formatDate(pk.createdAt) }}</template>
              </span>
            </span>
            <button
              type="button"
              :disabled="busy"
              class="text-sm text-grey-700 underline-offset-2 hover:text-red-500 hover:underline disabled:opacity-50"
              @click="onDeletePasskey(pk)"
            >
              Verwijderen
            </button>
          </li>
        </ul>
        <p v-else class="text-sm text-grey-700">Nog geen passkeys.</p>
      </section>

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
