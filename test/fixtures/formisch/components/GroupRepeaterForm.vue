<script lang="ts">
  import { useForm } from "@formisch/vue"
  import * as v from "valibot"

  interface Props {
    onSubmitted?: (data: unknown) => void
  }

  const schema = v.object({
    user: v.object({
      contacts: v.array(
        v.object({
          name: v.pipe(v.string(), v.minLength(1, "Name required")),
          email: v.pipe(v.string(), v.email("Invalid email")),
        }),
      ),
    }),
  })
</script>

<script setup lang="ts">
  const { onSubmitted } = defineProps<Props>()

  const form = useForm({
    schema,
    validate: "initial",
    initialInput: {
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
  <UForm v-slot="{ blurredFields }" :form="form" @submit="onSubmit">
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
