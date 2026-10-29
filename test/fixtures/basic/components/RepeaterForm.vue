<script lang="ts">
  import { useForm } from "@formwerk/core"
  import { z } from "zod"

  interface Contact {
    name: string
    email: string
  }

  interface Props {
    initialContacts?: Contact[]
    min?: number
    max?: number
    customWrapper?: boolean
  }

  const schema = z.object({
    contacts: z.array(
      z.object({
        name: z.string().min(1, "Name required"),
        email: z.email({ error: "Invalid email" }),
      }),
    ),
  })
</script>

<script setup lang="ts">
  const { initialContacts = [{ name: "alpha", email: "a@x.co" }], min, max, customWrapper = false } = defineProps<Props>()

  useForm({ schema, initialValues: { contacts: initialContacts } })

  const join = (names: ReadonlySet<string>) => [...names].sort().join(",")
</script>

<template>
  <UForm v-slot="{ blurredFields, touchedFields }">
    <UFormRepeater :name="'contacts'" :min="min" :max="max" :ui="{ root: 'repeater-root', item: 'repeater-item' }">
      <template v-if="customWrapper" #wrapper="{ Iteration, items }">
        <component :is="Iteration" v-for="(key, index) in items" :key="key" :index="index" as="section">
          <UFormField v-slot="{ model }" :data-testid="`name-field-${index}`" name="name" label="Name">
            <UInput v-bind="model" :data-testid="`name-input-${index}`" />
          </UFormField>
        </component>
      </template>

      <template #default="{ index, isFirst, isLast, repeater }">
        <span :data-testid="`position-${index}`">{{ isFirst ? "first" : "" }}{{ isLast ? "last" : "" }}</span>

        <UFormField v-slot="{ model }" :data-testid="`name-field-${index}`" name="name" label="Name">
          <UInput v-bind="model" :data-testid="`name-input-${index}`" />
        </UFormField>

        <UFormField v-slot="{ model }" :data-testid="`email-field-${index}`" name="email" label="Email">
          <UInput v-bind="model" :data-testid="`email-input-${index}`" />
        </UFormField>

        <button type="button" :data-testid="`remove-${index}`" @click="repeater.remove(index)">remove</button>
      </template>

      <template #trailing="{ repeater }">
        <button type="button" data-testid="add" @click="repeater.add()">add</button>
        <button type="button" data-testid="add-two" @click="repeater.add(2)">add two</button>
        <button type="button" data-testid="insert-1" @click="repeater.insert(1)">insert</button>
        <button type="button" data-testid="swap-0-2" @click="repeater.swap(0, 2)">swap</button>
        <button type="button" data-testid="move-0-2" @click="repeater.move(0, 2)">move</button>
        <button type="button" data-testid="move-2-0" @click="repeater.move(2, 0)">move back</button>
      </template>
    </UFormRepeater>

    <output data-testid="blurred">{{ join(blurredFields) }}</output>
    <output data-testid="touched">{{ join(touchedFields) }}</output>
  </UForm>
</template>
