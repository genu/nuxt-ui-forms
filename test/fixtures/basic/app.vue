<script setup lang="ts">
  import { useForm } from "@formwerk/core"

  useForm({ initialValues: { email: "initial@example.com" } })

  const onSubmit = () => {}
</script>

<template>
  <div>
    <div data-testid="basic">basic</div>

    <UForm data-testid="form" validate-on="blur" @submit="onSubmit">
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
