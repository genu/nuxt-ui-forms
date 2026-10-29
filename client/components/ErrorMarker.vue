<script lang="ts">
  interface Props {
    messages: string[]
  }

  const markerClass = [
    "inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-error font-sans text-xs font-bold text-inverted",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error",
  ]

  const content = { side: "left", align: "center", sideOffset: 6, collisionPadding: 8 } as const
</script>

<script setup lang="ts">
  const { messages } = defineProps<Props>()
</script>

<template>
  <UPopover v-if="messages.length" mode="hover" enable-touch :content="content">
    <button type="button" aria-label="Show error" :class="markerClass" data-error-marker>!</button>
    <template #content>
      <ul class="max-w-xs px-3 py-2 font-sans text-sm text-error" data-error-messages>
        <li v-for="message in messages" :key="message">{{ message }}</li>
      </ul>
    </template>
  </UPopover>
  <span v-else class="inline-block size-5 shrink-0" aria-hidden="true" />
</template>
