<script lang="ts">
  import { provideNameScope } from "../core/name-scope"
  import { useAdapter } from "../core/use-adapter"

  export interface GroupProps {
    name: string
  }

  export interface GroupSlots {
    default(): any
  }
</script>

<script setup lang="ts">
  const { name } = defineProps<GroupProps>()
  defineSlots<GroupSlots>()

  useAdapter().useGroup({ name })
  provideNameScope(() => name)
</script>

<template>
  <div>
    <slot />
  </div>
</template>
