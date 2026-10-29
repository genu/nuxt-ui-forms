<script lang="ts">
  import type { FormSnapshot } from "../../src/runtime/devtools/snapshot"
  import type { FieldTreeNode } from "~/utils/field-tree"

  interface Props {
    nodes: FieldTreeNode[]
    errors: FormSnapshot["errors"]
  }

  const label = (key: string) => (/^\d+$/.test(key) ? `[${key}]` : key)
</script>

<script setup lang="ts">
  const { nodes, errors } = defineProps<Props>()
</script>

<template>
  <ul class="flex flex-col gap-1">
    <li v-for="node in nodes" :key="node.path" :data-path="node.path">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded px-2 py-1 font-mono text-sm hover:bg-elevated/50">
        <span class="font-semibold text-highlighted">{{ label(node.key) }}</span>
        <span v-if="node.path !== node.key" class="text-xs text-dimmed">{{ node.path }}</span>
        <template v-if="node.field">
          <code class="max-w-md truncate text-toned" :title="compactJson(node.field.value)">{{ compactJson(node.field.value) }}</code>
          <StateBadges :flags="fieldFlags(node.field)" class="ms-auto" />
          <ErrorMarker :messages="fieldErrors(node.field, errors)" />
        </template>
      </div>
      <FieldTree v-if="node.children.length" :nodes="node.children" :errors="errors" class="ms-3 border-s border-default ps-3" />
    </li>
  </ul>
</template>
