<script lang="ts">
  import type { StateFlag } from "~/utils/display"

  interface Props {
    flags: StateFlag[]
  }
</script>

<script setup lang="ts">
  const { flags } = defineProps<Props>()
</script>

<template>
  <div class="flex flex-wrap gap-1">
    <UBadge
      v-for="flag in flags"
      :key="flag.label"
      :label="flag.label"
      :color="flag.active ? (flag.color ?? 'primary') : 'neutral'"
      :variant="flag.active ? 'solid' : 'outline'"
      :data-active="flag.active"
      size="sm" />
  </div>
</template>
