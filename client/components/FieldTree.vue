<script lang="ts">
  import type { FieldTreeNode } from "~/utils/field-tree"

  interface Props {
    nodes: FieldTreeNode[]
  }

  const label = (key: string) => (/^\d+$/.test(key) ? `[${key}]` : key)
</script>

<script setup lang="ts">
  const { nodes } = defineProps<Props>()
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
        </template>
      </div>
      <p v-if="node.field?.error" class="px-2 pb-1 text-sm text-error" data-error>{{ node.field.error }}</p>
      <FieldTree v-if="node.children.length" :nodes="node.children" class="ms-3 border-s border-default ps-3" />
    </li>
  </ul>
</template>
