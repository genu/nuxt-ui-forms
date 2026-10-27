<script lang="ts">
  import type { NavigationMenuItem } from "@nuxt/ui"
</script>

<script setup lang="ts">
  const items: NavigationMenuItem[] = [
    { label: "Simple", to: "/simple" },
    { label: "Nested", to: "/nested" },
    { label: "Repeater", to: "/repeater" },
    { label: "validateOn", to: "/validate-on" },
  ]
</script>

<template>
  <UApp>
    <header class="border-b border-default">
      <UContainer class="flex h-14 items-center justify-between gap-4">
        <NuxtLink to="/" class="font-semibold">nuxt-ui-forms</NuxtLink>
        <UNavigationMenu :items="items" />
        <UColorModeButton />
      </UContainer>
    </header>

    <UContainer class="py-10">
      <NuxtPage />
    </UContainer>
  </UApp>
</template>
