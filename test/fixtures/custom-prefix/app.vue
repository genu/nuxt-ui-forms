<script setup lang="ts">
  import { useForm } from "@formwerk/core"

  useForm()

  const onSubmit = () => {}
</script>

<template>
  <div>
    <div data-testid="basic">custom-prefix</div>

    <NForm data-testid="form" validate-on="blur" @submit="onSubmit">
      <NFormField data-testid="form-field" name="email" label="Email">
        <template #default="{ model }">
          <NInput v-bind="model" data-testid="email-input" />
        </template>
      </NFormField>
    </NForm>

    <NuxtUiFormField data-testid="nuxtui-form-field" name="test" label="Test Field">
      <NInput data-testid="test-input" />
    </NuxtUiFormField>
  </div>
</template>
