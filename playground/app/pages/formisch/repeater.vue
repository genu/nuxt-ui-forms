<script lang="ts">
  import { getInput, useForm } from "@formisch/vue"
  import * as v from "valibot"

  const MIN_CONTACTS = 1
  const MAX_CONTACTS = 5
  const MAX_TAGS = 4

  const contactsUi = { root: "space-y-3", wrapper: "space-y-3", item: "rounded-lg border border-default p-4" }

  const schema = v.object({
    contacts: v.pipe(
      v.array(
        v.object({
          name: v.pipe(v.string("Contact name is required"), v.minLength(1, "Contact name is required")),
          email: v.pipe(v.string("Enter a valid contact email"), v.email("Enter a valid contact email")),
        }),
      ),
      v.minLength(MIN_CONTACTS),
      v.maxLength(MAX_CONTACTS),
    ),
    tags: v.pipe(
      v.array(v.object({ label: v.pipe(v.string("Tag is required"), v.minLength(1, "Tag is required")) })),
      v.maxLength(MAX_TAGS),
    ),
  })
</script>

<script setup lang="ts">
  const form = useForm({
    schema,
    validate: "initial",
    initialInput: {
      contacts: [
        { name: "Ada", email: "ada@example.com" },
        { name: "", email: "not-an-email" },
      ],
      tags: [{ label: "vip" }],
    },
  })
  const values = computed(() => getInput(form))
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
      color="info"
      variant="subtle"
      icon="i-lucide-info"
      title="Rows keep their state"
      description="Formisch keeps each row's id through remove, insert, move and swap, so rows keep their blurred/touched state." />

    <div class="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <UCard>
        <UForm
          id="Repeater Form"
          v-slot="{ blurredFields, touchedFields, dirtyFields }"
          :form="form"
          class="space-y-6"
          @submit="onSubmit"
>
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
