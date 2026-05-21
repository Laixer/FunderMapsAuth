<script setup lang="ts">
import { RouterView } from 'vue-router'

import logo from '@assets/svg/fundermaps-inverted.svg?url'
</script>

<template>
  <!-- Brand shell for every auth screen: full-bleed background, logo top-left,
       the active view (a card) centered. -->
  <div class="page-no-session relative grid min-h-screen place-content-center p-6">
    <img :src="logo" alt="FunderMaps" class="absolute top-8 left-8 h-8 sm:h-9" />
    <RouterView />
  </div>
</template>
