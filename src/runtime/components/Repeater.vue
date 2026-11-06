<script lang="ts">
  import { computed, type Component } from "vue"
  import { resolveFullName, useNameScope } from "../core/name-scope"
  import { createScopedIteration } from "../core/scoped-iteration"
  import { useAdapter } from "../core/use-adapter"

  export interface RepeaterProps {
    name: string
    min?: number
    max?: number
    ui?: {
      root?: string
      leading?: string
      wrapper?: string
      item?: string
      trailing?: string
    }
  }

  export interface RepeaterMethods {
    add: (count?: number) => void
    remove: (index: number) => void
    move: (from: number, to: number) => void
    swap: (indexA: number, indexB: number) => void
    insert: (index: number) => void
  }

  export interface RepeaterSlotProps {
    items: readonly string[]
    repeater: RepeaterMethods
  }

  export interface RepeaterDefaultSlotProps extends RepeaterSlotProps {
    index: number
    isFirst: boolean
    isLast: boolean
  }

  export interface RepeaterWrapperSlotProps extends RepeaterSlotProps {
    Iteration: Component
  }

  export interface RepeaterSlots {
    leading: (props: RepeaterSlotProps) => unknown
    wrapper: (props: RepeaterWrapperSlotProps) => unknown
    default: (props: RepeaterDefaultSlotProps) => unknown
    trailing: (props: RepeaterSlotProps) => unknown
  }
</script>

<script setup lang="ts">
  const { name, min, max, ui } = defineProps<RepeaterProps>()
  defineSlots<RepeaterSlots>()

  const scope = useNameScope()
  const fullName = computed(() => resolveFullName(name, scope))
  const { Iteration: AdapterIteration, items, ...repeater } = useAdapter().useArray({ name, fullName: () => fullName.value, min, max })
  const Iteration = createScopedIteration(() => name, AdapterIteration)
</script>

<template>
  <div :class="ui?.root">
    <div v-if="$slots.leading" :class="ui?.leading">
      <slot name="leading" :items="items" :repeater="repeater" />
    </div>
    <div :class="ui?.wrapper">
      <slot name="wrapper" v-bind="{ items, repeater, Iteration }">
        <Iteration v-for="(key, index) in items" :key="key" :index="index" as="div" :class="ui?.item">
          <slot :index="index" :items="items" :is-first="index === 0" :is-last="index === items.length - 1" :repeater="repeater" />
        </Iteration>
      </slot>
    </div>
    <div v-if="$slots.trailing" :class="ui?.trailing">
      <slot name="trailing" :items="items" :repeater="repeater" />
    </div>
  </div>
</template>
