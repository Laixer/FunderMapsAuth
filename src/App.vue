<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'

import logo from '@assets/svg/fundermaps-inverted.svg?url'

// The router shows nothing until the session check in front of the account
// page has answered. Until then the shell shows that page's own loading card,
// so a slow API does not leave the screen empty.
const opensAccountPage = useRouter().resolve(window.location.pathname).name === 'home'
</script>

<template>
  <!-- Brand shell for every auth screen: full-bleed background, logo top-left,
       the active view (a card) centered. Below `lg` the card does not fit
       beside the logo, so the top padding keeps it underneath. -->
  <div class="page-no-session relative grid min-h-screen place-content-center px-6 pt-24 pb-6 lg:p-6">
    <img :src="logo" alt="FunderMaps" class="absolute top-8 left-8 h-8 sm:h-9" />
    <RouterView v-slot="{ Component }">
      <component :is="Component" v-if="Component" />
      <div v-else-if="opensAccountPage" class="w-[calc(100vw-3rem)] sm:w-[30rem] space-y-6 rounded-xl bg-white p-8 shadow-card">
        <p class="text-sm text-grey-700">Laden…</p>
      </div>
    </RouterView>
  </div>
</template>
