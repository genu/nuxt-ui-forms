<script lang="ts">
  import type { FormSnapshot } from "../../src/runtime/devtools/snapshot"
  import { copyText } from "~/utils/clipboard"

  interface Props {
    form: FormSnapshot
  }
</script>

<script setup lang="ts">
  const { form } = defineProps<Props>()

  const tree = computed(() => buildFieldTree(form.fields))
  const errors = computed(() => Object.entries(form.errors).filter(([, messages]) => messages.length))
  const valuesJson = computed(() => prettyJson(form.values))

  const copyState = ref<"idle" | "copied" | "failed">("idle")
  const copyLabel = computed(() => ({ idle: "Copy", copied: "Copied", failed: "Failed" })[copyState.value])
  let resetCopyState: ReturnType<typeof setTimeout> | undefined

  const copyValues = async () => {
    copyState.value = (await copyText(valuesJson.value)) ? "copied" : "failed"
    clearTimeout(resetCopyState)
    resetCopyState = setTimeout(() => (copyState.value = "idle"), 1500)
  }

  onBeforeUnmount(() => clearTimeout(resetCopyState))
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
      <FieldTree v-if="tree.length" :nodes="tree" :errors="form.errors" />
      <p v-else class="text-sm text-muted">No fields registered</p>
    </UCard>

    <div class="grid gap-4 lg:grid-cols-2">
      <UCard :ui="{ body: 'sm:p-4' }">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <h3 class="font-semibold">Values</h3>
            <UButton
              :label="copyLabel"
              :color="copyState === 'failed' ? 'error' : 'neutral'"
              variant="outline"
              size="xs"
              class="w-16 justify-center"
              data-copy-values
              @click="copyValues" />
          </div>
        </template>
        <pre class="overflow-auto font-mono text-xs text-toned" data-values>{{ valuesJson }}</pre>
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
