<script lang="ts">
  import { useForm } from "@formwerk/core"
  import { z } from "zod"

  const MIN_CONTACTS = 1
  const MAX_CONTACTS = 5
  const MAX_TAGS = 4

  const contactsUi = { root: "space-y-3", wrapper: "space-y-3", item: "rounded-lg border border-default p-4" }

  const schema = z.object({
    contacts: z
      .array(
        z.object({
          name: z.string({ error: "Contact name is required" }).min(1, "Contact name is required"),
          email: z.email({ error: "Enter a valid contact email" }),
        }),
      )
      .min(MIN_CONTACTS)
      .max(MAX_CONTACTS),
    tags: z.array(z.object({ label: z.string({ error: "Tag is required" }).min(1, "Tag is required") })).max(MAX_TAGS),
  })
</script>

<script setup lang="ts">
  const { values } = useForm({
    id: "Repeater Form",
    schema,
    initialValues: {
      contacts: [
        { name: "Ada", email: "ada@example.com" },
        { name: "", email: "not-an-email" },
      ],
      tags: [{ label: "vip" }],
    },
  })
  const toast = useToast()
  const submitted = ref<unknown>()

  const onSubmit = ({ data }: { data: unknown }) => {
    submitted.value = data
    toast.add({ title: "Form submitted", color: "success" })
  }
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Repeater</h1>
      <p class="mt-1 text-muted">
        Row fields use relative names (<code>name</code>, <code>email</code>) and resolve to <code>contacts.0.name</code> and so on.
        Contacts allow {{ MIN_CONTACTS }} to {{ MAX_CONTACTS }} rows.
      </p>
    </div>

    <UAlert
      color="warning"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      title="Known limitation"
      description="With Formwerk 0.14.4, remove and insert rebuild every row key, so all rows remount and lose their blurred/touched state. Move and swap keep it." />

    <div class="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <UCard>
        <UForm v-slot="{ blurredFields, touchedFields, dirtyFields }" class="space-y-6" @submit="onSubmit">
          <section class="space-y-3">
            <h2 class="font-medium">Contacts</h2>
            <UFormRepeater name="contacts" :min="MIN_CONTACTS" :max="MAX_CONTACTS" :ui="contactsUi">
              <template #default="{ index, items, isFirst, isLast, repeater }">
                <div class="flex items-start gap-3">
                  <UFormField v-slot="{ model }" name="name" label="Name" class="flex-1">
                    <UInput v-bind="model" placeholder="Contact name" class="w-full" />
                  </UFormField>
                  <UFormField v-slot="{ model }" name="email" label="Email" class="flex-1">
                    <UInput v-bind="model" placeholder="Contact email" class="w-full" />
                  </UFormField>
                  <div class="mt-6 flex gap-1">
                    <UButton
                      icon="i-lucide-arrow-up"
                      color="neutral"
                      variant="ghost"
                      :aria-label="`Move contact ${index + 1} up`"
                      :disabled="isFirst"
                      @click="repeater.move(index, index - 1)" />
                    <UButton
                      icon="i-lucide-arrow-down"
                      color="neutral"
                      variant="ghost"
                      :aria-label="`Move contact ${index + 1} down`"
                      :disabled="isLast"
                      @click="repeater.move(index, index + 1)" />
                    <UButton
                      icon="i-lucide-list-plus"
                      color="neutral"
                      variant="ghost"
                      :aria-label="`Insert contact after ${index + 1}`"
                      :disabled="items.length >= MAX_CONTACTS"
                      @click="repeater.insert(index + 1)" />
                    <UButton
                      icon="i-lucide-trash"
                      color="error"
                      variant="ghost"
                      :aria-label="`Remove contact ${index + 1}`"
                      :disabled="items.length <= MIN_CONTACTS"
                      @click="repeater.remove(index)" />
                  </div>
                </div>
              </template>

              <template #trailing="{ items, repeater }">
                <div class="flex items-center gap-3">
                  <UButton
                    icon="i-lucide-plus"
                    label="Add contact"
                    variant="outline"
                    :disabled="items.length >= MAX_CONTACTS"
                    @click="repeater.add()" />
                  <span data-state="contact-count" class="text-sm text-muted">{{ items.length }} / {{ MAX_CONTACTS }}</span>
                </div>
              </template>
            </UFormRepeater>
          </section>

          <section class="space-y-3">
            <h2 class="font-medium">Tags</h2>
            <p class="text-sm text-muted">
              Custom layout through the <code>wrapper</code> slot. Render its <code>Iteration</code> with
              <code>&lt;component :is="Iteration"&gt;</code>.
            </p>
            <UFormRepeater name="tags" :max="MAX_TAGS">
              <template #wrapper="{ items, Iteration, repeater }">
                <div class="flex flex-wrap gap-2">
                  <component :is="Iteration" v-for="(key, index) in items" :key="key" :index="index" as="div">
                    <div class="flex items-start gap-1">
                      <UFormField v-slot="{ model }" name="label">
                        <UInput v-bind="model" placeholder="Tag" class="w-32" />
                      </UFormField>
                      <UButton
                        icon="i-lucide-x"
                        color="neutral"
                        variant="ghost"
                        :aria-label="`Remove tag ${index + 1}`"
                        @click="repeater.remove(index)" />
                    </div>
                  </component>
                </div>
              </template>

              <template #trailing="{ items, repeater }">
                <UButton
                  icon="i-lucide-plus"
                  label="Add tag"
                  size="sm"
                  variant="outline"
                  class="mt-2"
                  :disabled="items.length >= MAX_TAGS"
                  @click="repeater.add()" />
              </template>
            </UFormRepeater>
          </section>

          <UButton type="submit" label="Submit" />

          <USeparator />

          <FormState :values="values" :blurred="blurredFields" :touched="touchedFields" :dirty="dirtyFields" />
        </UForm>
      </UCard>

      <UCard>
        <h2 class="font-semibold">Last submit</h2>
        <pre data-state="submitted" class="mt-2 overflow-x-auto text-xs">{{ submitted ?? "nothing yet" }}</pre>
      </UCard>
    </div>
  </div>
</template>
