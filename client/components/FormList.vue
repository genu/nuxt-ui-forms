<script lang="ts">
  import type { FormSnapshot } from "../../src/runtime/devtools/snapshot"

  interface Props {
    forms: FormSnapshot[]
    selectedId?: string
  }

  interface Emits {
    select: [id: string]
  }
</script>

<script setup lang="ts">
  const { forms, selectedId } = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const itemClass = (id: string) => [
    "flex w-full flex-col gap-2 rounded-md border px-3 py-2 text-left transition-colors",
    id === selectedId ? "border-primary bg-elevated" : "border-transparent hover:bg-elevated/50",
  ]
</script>

<template>
  <ul class="flex flex-col gap-1 p-2">
    <li v-for="form in forms" :key="form.id">
      <button type="button" :class="itemClass(form.id)" :data-form-id="form.id" @click="emit('select', form.id)">
        <span class="flex items-center justify-between gap-2">
          <span class="truncate font-mono text-sm font-semibold text-highlighted">{{ form.id }}</span>
          <UBadge :label="form.adapter" color="neutral" variant="subtle" size="sm" />
        </span>
        <StateBadges :flags="formFlags(form.state)" />
      </button>
    </li>
  </ul>
</template>
