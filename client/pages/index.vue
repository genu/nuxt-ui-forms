<script lang="ts">
  import type { NuxtDevtoolsHostClient } from "@nuxt/devtools-kit/types"

  type HostWindow = Window & { __NUXT_DEVTOOLS_HOST__?: NuxtDevtoolsHostClient }
</script>

<script setup lang="ts">
  const host = shallowRef<NuxtDevtoolsHostClient>()

  onMounted(() => {
    host.value = (window.parent as HostWindow).__NUXT_DEVTOOLS_HOST__
  })
</script>

<template>
  <main>
    <h1>Forms devtools</h1>
    <p v-if="host" data-host="reachable">Host app reachable (Vue {{ host.nuxt.vueApp.version }})</p>
    <p v-else data-host="unreachable">Host app not reachable</p>
  </main>
</template>

<style scoped>
  main {
    min-height: 100vh;
    padding: 2rem;
    font-family: system-ui, sans-serif;
    color-scheme: light dark;
    background: Canvas;
    color: CanvasText;
  }

  [data-host="reachable"] {
    color: #16a34a;
  }

  [data-host="unreachable"] {
    color: #ca8a04;
  }
</style>
