<script lang="ts">
  import { useForm } from "@formisch/vue"
  import * as v from "valibot"
  import { z } from "zod"

  interface Props {
    validate?: (state: unknown) => unknown[]
    onSubmitted?: (data: unknown) => void
  }

  const schema = v.object({
    email: v.pipe(v.string("Invalid email"), v.email("Invalid email")),
  })

  const nuxtUiSchema = z.object({
    email: z.literal("never valid for Nuxt UI"),
  })
</script>

<script setup lang="ts">
  const { validate, onSubmitted } = defineProps<Props>()

  const form = useForm({ schema, initialInput: { email: "a@b.co" }, validate: "initial" })

  const onSubmit = (event: { data: unknown }) => onSubmitted?.(event.data)
</script>

<template>
  <UForm
data-testid="form"
:form="form"
:schema="nuxtUiSchema"
:state="{}"
:validate="validate"
@submit="onSubmit"
>
    <UFormField v-slot="{ model }" data-testid="email-field" name="email" label="Email" error="from attrs">
      <UInput v-bind="model" data-testid="email-input" />
    </UFormField>
  </UForm>
</template>
