<script lang="ts">
  import type { FormSnapshot } from "../../src/runtime/devtools/snapshot"

  interface Props {
    form: FormSnapshot
  }
</script>

<script setup lang="ts">
  const { form } = defineProps<Props>()

  const tree = computed(() => buildFieldTree(form.fields))
  const errors = computed(() => Object.entries(form.errors).filter(([, messages]) => messages.length))
</script>

<template>
  <div class="flex flex-col gap-4 p-4">
    <header class="flex flex-wrap items-center gap-3">
      <h2 class="font-mono text-lg font-semibold text-highlighted">{{ form.id }}</h2>
      <UBadge :label="form.adapter" color="neutral" variant="subtle" />
      <StateBadges :flags="formFlags(form.state)" />
    </header>

    <UCard :ui="{ body: 'sm:p-4' }">
      <template #header>
        <h3 class="font-semibold">Fields ({{ form.fields.length }})</h3>
      </template>
      <FieldTree v-if="tree.length" :nodes="tree" />
      <p v-else class="text-sm text-muted">No fields registered</p>
    </UCard>

    <div class="grid gap-4 lg:grid-cols-2">
      <UCard :ui="{ body: 'sm:p-4' }">
        <template #header>
          <h3 class="font-semibold">Values</h3>
        </template>
        <pre class="overflow-auto font-mono text-xs text-toned" data-values>{{ prettyJson(form.values) }}</pre>
      </UCard>

      <UCard :ui="{ body: 'sm:p-4' }">
        <template #header>
          <h3 class="font-semibold">Errors ({{ errors.length }})</h3>
        </template>
        <ul v-if="errors.length" class="flex flex-col gap-2 text-sm" data-errors>
          <li v-for="[path, messages] in errors" :key="path">
            <span class="font-mono text-highlighted">{{ path }}</span>
            <ul class="ms-4 list-disc text-error">
              <li v-for="message in messages" :key="message">{{ message }}</li>
            </ul>
          </li>
        </ul>
        <p v-else class="text-sm text-muted">No errors</p>
      </UCard>
    </div>
  </div>
</template>
