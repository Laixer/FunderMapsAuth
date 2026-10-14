<script setup lang="ts">
import { RouterView } from 'vue-router'

import logo from '@assets/svg/fundermaps-inverted.svg?url'
</script>

<template>
  <!-- Brand shell for every auth screen: full-bleed background, logo top-left,
       the active view (a card) centered. Below `lg` the card does not fit
       beside the logo, so the top padding keeps it underneath. -->
  <div class="page-no-session relative grid min-h-screen place-content-center px-6 pt-24 pb-6 lg:p-6">
    <img :src="logo" alt="FunderMaps" class="absolute top-8 left-8 h-8 sm:h-9" />
    <!-- The router shows nothing until the first page has passed its guard,
         which on the login and account pages waits for the session check.
         Until then a loading card, so a slow API does not leave the screen empty. -->
    <RouterView v-slot="{ Component }">
      <component :is="Component" v-if="Component" />
      <div v-else class="w-[calc(100vw-3rem)] sm:w-[30rem] space-y-6 rounded-xl bg-white p-8 shadow-card">
        <p class="text-sm text-grey-700">Laden…</p>
      </div>
    </RouterView>
  </div>
</template>
