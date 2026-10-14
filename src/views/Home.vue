<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  addPasskey,
  deletePasskey,
  getSession,
  listPasskeys,
  SessionExpiredError,
  signOut,
  type Passkey,
  type SessionUser,
} from '@/services/auth'

const router = useRouter()

const user = ref<SessionUser | null>(null)
const loading = ref(true)
const passkeys = ref<Passkey[]>([])
// False until the list has been read: "none yet" is only true when we know.
const passkeysLoaded = ref(false)
const passkeyError = ref<string | null>(null)
const signOutFailed = ref(false)
const busy = ref(false)
const passkeysSupported = typeof window !== 'undefined' && typeof window.PublicKeyCredential !== 'undefined'

const apps = [
  { name: 'Kaart', href: 'https://maps.fundermaps.com', blurb: 'Funderingsrisico per pand' },
  { name: 'Studio', href: 'https://studio.fundermaps.com', blurb: 'Invoer en beoordeling' },
  // The admin portal lets only administrators in.
  { name: 'Beheer', href: 'https://admin.fundermaps.com', blurb: 'Gebruikers en organisaties', administrator: true },
]
const visibleApps = computed(() => apps.filter((app) => !app.administrator || user.value?.role === 'administrator'))

/**
 * When the API wants a new login, that is said on the login page, not as an
 * error here. The errors that do stay here are our own Dutch ones: the API's
 * are English.
 */
function toLoginIfExpired(e: unknown): boolean {
  if (!(e instanceof SessionExpiredError)) return false
  router.push({ name: 'login', query: { expired: '1' } })
  return true
}

async function refreshPasskeys() {
  try {
    passkeys.value = await listPasskeys()
    passkeysLoaded.value = true
  } catch (e) {
    passkeysLoaded.value = false
    if (!toLoginIfExpired(e)) passkeyError.value = 'Passkeys ophalen mislukt.'
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
    if (toLoginIfExpired(e)) return
    const msg = e instanceof Error ? e.message : ''
    // Dismissing the browser prompt is not an error.
    if (!/abort|cancel|NotAllowed/i.test(msg)) passkeyError.value = 'Passkey toevoegen mislukt.'
  } finally {
    busy.value = false
  }
}

async function onDeletePasskey(pk: Passkey) {
  if (busy.value) return
  if (!window.confirm(pk.name ? `Passkey "${pk.name}" verwijderen?` : 'Deze passkey verwijderen?')) return
  busy.value = true
  passkeyError.value = null
  try {
    await deletePasskey(pk.id)
    await refreshPasskeys()
  } catch (e) {
    if (!toLoginIfExpired(e)) passkeyError.value = 'Passkey verwijderen mislukt.'
  } finally {
    busy.value = false
  }
}

function formatDate(d: Passkey['createdAt']): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function onSignOut() {
  signOutFailed.value = false
  if (!(await signOut())) {
    // Still logged in: the login form would say otherwise.
    signOutFailed.value = true
    return
  }
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="w-[calc(100vw-3rem)] sm:w-[30rem] space-y-6 rounded-xl bg-white p-8 shadow-card">
    <p v-if="loading" class="text-sm text-grey-700">Laden…</p>
    <template v-else>
      <header class="space-y-1">
        <h1 class="text-2xl font-extrabold text-blue-900">Ingelogd</h1>
        <p class="text-sm text-grey-700">Je bent ingelogd bij FunderMaps als <span class="font-medium text-grey-800">{{ user?.email }}</span>.</p>
      </header>

      <section class="space-y-2">
        <h2 class="text-xs font-semibold uppercase tracking-wide text-grey-700">Ga verder naar</h2>
        <ul class="divide-y divide-grey-200 rounded-lg border border-grey-200">
          <li v-for="app in visibleApps" :key="app.href">
            <a :href="app.href" class="flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-grey-100 focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-green-500/40 focus-visible:outline-none">
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
            class="rounded text-sm font-semibold text-green-700 underline-offset-2 enabled:hover:underline focus-visible:ring-2 focus-visible:ring-green-500/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
          <!-- Below sm the button lines up with the name: the lines under it may be
               wider than their column and pass beneath it. -->
          <li v-for="pk in passkeys" :key="pk.id" class="flex items-start justify-between gap-4 px-4 py-3 text-sm sm:items-center">
            <span class="min-w-0">
              <span class="block font-medium text-grey-800">{{ pk.name || 'Passkey' }}</span>
              <span class="block text-grey-700">
                {{ pk.deviceType === 'multiDevice' ? 'Gesynchroniseerd' : 'Alleen dit apparaat' }}
                <!-- On a phone the date gets its own line: no dot left hanging. -->
                <template v-if="pk.createdAt"><span class="hidden sm:inline"> · </span><span class="block whitespace-nowrap sm:inline">toegevoegd {{ formatDate(pk.createdAt) }}</span></template>
              </span>
            </span>
            <button
              type="button"
              :disabled="busy"
              class="rounded text-sm text-grey-700 underline-offset-2 enabled:hover:text-red-500 enabled:hover:underline focus-visible:ring-2 focus-visible:ring-green-500/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              @click="onDeletePasskey(pk)"
            >
              Verwijderen
            </button>
          </li>
        </ul>
        <p v-else-if="passkeysLoaded" class="text-sm text-grey-700">Nog geen passkeys.</p>
      </section>

      <p v-if="signOutFailed" class="rounded-lg border-l-4 border-red-500 bg-yellow-100 px-4 py-3 text-sm text-red-500" role="alert">
        Uitloggen is niet gelukt. Probeer het opnieuw.
      </p>

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
