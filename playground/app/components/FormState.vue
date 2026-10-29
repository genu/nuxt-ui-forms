<script lang="ts">
  interface Props {
    values?: unknown
    blurred: ReadonlySet<string>
    touched: ReadonlySet<string>
    dirty: ReadonlySet<string>
  }
</script>

<script setup lang="ts">
  const { values, blurred, touched, dirty } = defineProps<Props>()

  const rows = computed(() => [
    { label: "Blurred", names: blurred },
    { label: "Touched", names: touched },
    { label: "Dirty", names: dirty },
  ])
</script>

<template>
  <div class="space-y-3 text-sm">
    <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
      <template v-for="row in rows" :key="row.label">
        <dt class="font-medium text-muted">{{ row.label }}</dt>
        <dd :data-state="row.label.toLowerCase()" class="font-mono">{{ [...row.names].sort().join(", ") || "none" }}</dd>
      </template>
    </dl>
    <pre v-if="values !== undefined" data-state="values" class="overflow-x-auto rounded-md bg-elevated p-3 text-xs">{{ values }}</pre>
  </div>
</template>
