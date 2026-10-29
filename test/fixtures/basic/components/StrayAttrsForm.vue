<script lang="ts">
  import { useForm } from "@formwerk/core"
  import { z } from "zod"

  interface Props {
    validate?: (state: unknown) => unknown[]
    onSubmitted?: (data: unknown) => void
  }

  const schema = z.object({
    email: z.email({ error: "Invalid email" }),
  })

  const nuxtUiSchema = z.object({
    email: z.literal("never valid for Nuxt UI"),
  })
</script>

<script setup lang="ts">
  const { validate, onSubmitted } = defineProps<Props>()

  useForm({ schema, initialValues: { email: "a@b.co" } })

  const onSubmit = (event: { data: unknown }) => onSubmitted?.(event.data)
</script>

<template>
  <UForm data-testid="form" :schema="nuxtUiSchema" :state="{}" :validate="validate" @submit="onSubmit">
    <UFormField v-slot="{ model }" data-testid="email-field" name="email" label="Email" error="from attrs">
      <UInput v-bind="model" data-testid="email-input" />
    </UFormField>
  </UForm>
</template>
