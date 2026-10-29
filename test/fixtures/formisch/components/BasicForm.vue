<script lang="ts">
  import { useForm } from "@formisch/vue"
  import * as v from "valibot"
  import type { ValidateOn } from "../../../../src/runtime/types"

  interface Props {
    validateOn?: ValidateOn
    disabled?: boolean
    showNickname?: boolean
    initialValues?: { email?: string; nickname?: string }
    onSubmitted?: (data: unknown) => void | Promise<void>
  }

  const schema = v.object({
    email: v.pipe(v.string("Invalid email"), v.email("Invalid email")),
    nickname: v.optional(v.pipe(v.string(), v.trim())),
  })
</script>

<script setup lang="ts">
  const { validateOn, disabled = false, showNickname = false, initialValues, onSubmitted } = defineProps<Props>()

  const form = useForm({ schema, initialInput: initialValues, validate: "initial" })

  const onSubmit = (event: { data: unknown }) => onSubmitted?.(event.data)
  const join = (names: ReadonlySet<string>) => [...names].sort().join(",")
</script>

<template>
  <UForm
    v-slot="{ blurredFields, touchedFields, dirtyFields }"
    :form="form"
    :validate-on="validateOn"
    :disabled="disabled"
    @submit="onSubmit"
>
    <UFormField v-slot="{ model }" data-testid="email-field" name="email" label="Email">
      <UInput v-bind="model" data-testid="email-input" />
    </UFormField>

    <UFormField v-if="showNickname" v-slot="{ model }" data-testid="nickname-field" name="nickname" label="Nickname">
      <UInput v-bind="model" data-testid="nickname-input" />
    </UFormField>

    <output data-testid="blurred">{{ join(blurredFields) }}</output>
    <output data-testid="touched">{{ join(touchedFields) }}</output>
    <output data-testid="dirty">{{ join(dirtyFields) }}</output>

    <button type="submit">Submit</button>
  </UForm>
</template>
