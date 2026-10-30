<script setup lang="ts">
  const { formsAdapter } = useRuntimeConfig().public

  const pages = [
    {
      to: `/${formsAdapter}/simple`,
      title: "Simple",
      description: "Text, checkbox and switch fields with submit, reset and live values.",
    },
    { to: `/${formsAdapter}/nested`, title: "Nested", description: "UFormGroup for an address, and a repeater inside a group." },
    {
      to: `/${formsAdapter}/repeater`,
      title: "Repeater",
      description: "Add, insert, remove and move rows with min/max and per-row errors.",
    },
    {
      to: `/${formsAdapter}/validate-on`,
      title: "validateOn",
      description: "The blur, touched and dirty error-visibility gates side by side.",
    },
  ]
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-3xl font-bold">nuxt-ui-forms playground</h1>
      <p class="mt-2 text-muted">
        Nuxt UI form components driven by the <code>{{ formsAdapter }}</code> adapter.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <NuxtLink v-for="page in pages" :key="page.to" :to="page.to">
        <UCard class="h-full transition hover:ring-primary">
          <h2 class="font-semibold">{{ page.title }}</h2>
          <p class="mt-1 text-sm text-muted">{{ page.description }}</p>
        </UCard>
      </NuxtLink>
    </div>
  </div>
</template>
