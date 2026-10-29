<script setup lang="ts">
  const { forms, connected, selectedId, selected } = useFormsHub()

  const select = (id: string) => (selectedId.value = id)
</script>

<template>
  <main class="flex h-screen text-default">
    <div v-if="!connected" class="m-auto max-w-md p-4" data-state="disconnected">
      <UAlert
        color="warning"
        variant="subtle"
        title="Not running inside Nuxt DevTools"
        description="Open this page from the Forms tab of Nuxt DevTools in a running dev app." />
    </div>

    <div v-else-if="!forms.length" class="m-auto max-w-md p-4" data-state="empty">
      <UAlert
        color="neutral"
        variant="subtle"
        title="No forms mounted"
        description="Forms appear here while a UForm is mounted on the current page." />
    </div>

    <template v-else>
      <aside class="w-72 shrink-0 overflow-y-auto border-e border-default" data-state="forms">
        <div class="flex items-center justify-between gap-2 px-4 pt-4">
          <h1 class="text-xs font-semibold tracking-wide text-muted uppercase">Forms ({{ forms.length }})</h1>
          <UBadge :label="forms[0]?.adapter" color="neutral" variant="subtle" size="sm" data-adapter />
        </div>
        <FormList :forms="forms" :selected-id="selected?.id" @select="select" />
      </aside>
      <section class="min-w-0 flex-1 overflow-y-auto">
        <FormDetail v-if="selected" :form="selected" />
      </section>
    </template>
  </main>
</template>
