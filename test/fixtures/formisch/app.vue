<script lang="ts">
  import { useForm } from "@formisch/vue"
  import * as v from "valibot"

  const schema = v.object({
    email: v.optional(v.string()),
    username: v.optional(v.string()),
  })
</script>

<script setup lang="ts">
  const form = useForm({ schema, initialInput: { email: "initial@example.com" } })

  const onSubmit = () => {}
</script>

<template>
  <div>
    <div data-testid="basic">basic</div>

    <UForm data-testid="form" :form="form" validate-on="blur" @submit="onSubmit">
      <UFormField data-testid="form-field" name="email" label="Email">
        <template #default="{ model }">
          <UInput v-bind="model" data-testid="email-input" />
        </template>
      </UFormField>

      <UFormField data-testid="form-field-required" name="username" label="Username" required>
        <template #default="{ model }">
          <UInput v-bind="model" data-testid="username-input" />
        </template>
      </UFormField>
    </UForm>

    <NuxtUiFormField data-testid="nuxtui-form-field" name="test" label="Test Field">
      <UInput data-testid="test-input" />
    </NuxtUiFormField>
  </div>
</template>
