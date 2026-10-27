<script lang="ts">
  import { useForm } from "@formwerk/core"
  import { z } from "zod"

  interface Props {
    onSubmitted?: (data: unknown) => void
  }

  const schema = z.object({
    user: z.object({
      contacts: z.array(
        z.object({
          name: z.string().min(1, "Name required"),
          email: z.email({ error: "Invalid email" }),
        }),
      ),
    }),
  })
</script>

<script setup lang="ts">
  const { onSubmitted } = defineProps<Props>()

  useForm({
    schema,
    initialValues: {
      user: {
        contacts: [
          { name: "", email: "a@x.co" },
          { name: "", email: "b@x.co" },
        ],
      },
    },
  })

  const onSubmit = (event: { data: unknown }) => onSubmitted?.(event.data)
  const join = (names: ReadonlySet<string>) => [...names].sort().join(",")
</script>

<template>
  <UForm v-slot="{ blurredFields }" @submit="onSubmit">
    <UFormGroup name="user">
      <UFormRepeater name="contacts">
        <template #default="{ index, repeater }">
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
        </template>
      </UFormRepeater>
    </UFormGroup>

    <output data-testid="blurred">{{ join(blurredFields) }}</output>

    <button type="submit">Submit</button>
  </UForm>
</template>
