<script lang="ts">
  import type { FlagColor, IndicatorIcon } from "~/utils/display"

  interface Indicator {
    label: string
    icon: IndicatorIcon
    color: FlagColor
  }

  interface Props {
    indicators: Indicator[]
  }

  const colorClasses: Record<FlagColor, string> = {
    primary: "bg-primary/15 text-primary ring-primary/30",
    success: "bg-success/15 text-success ring-success/30",
    warning: "bg-warning/15 text-warning ring-warning/30",
    error: "bg-error/15 text-error ring-error/30",
    info: "bg-info/15 text-info ring-info/30",
  }

  const iconNames: Record<IndicatorIcon, string> = {
    invalid: "i-lucide-x",
    valid: "i-lucide-check",
    attempted: "i-lucide-send",
    dirty: "i-lucide-pencil",
    submitting: "i-lucide-loader-circle",
  }
</script>

<script setup lang="ts">
  const { indicators } = defineProps<Props>()

  const chipFor = (item: Indicator) => ({
    role: "img",
    title: item.label,
    "aria-label": item.label,
    class: ["inline-flex size-5 items-center justify-center rounded-md ring-1 ring-inset", colorClasses[item.color]],
  })
</script>

<template>
  <span class="flex shrink-0 items-center gap-1">
    <span v-for="item in indicators" :key="item.label" v-bind="chipFor(item)">
      <UIcon :name="iconNames[item.icon]" class="size-3.5" :class="{ 'animate-spin': item.icon === 'submitting' }" />
    </span>
  </span>
</template>
