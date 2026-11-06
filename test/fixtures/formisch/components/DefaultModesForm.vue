<script lang="ts">
  import { useForm } from "@formisch/vue"
  import * as v from "valibot"

  const schema = v.object({
    email: v.pipe(v.string("Required"), v.minLength(1, "Required")),
  })
</script>

<script setup lang="ts">
  const form = useForm({ schema })
</script>

<template>
  <UForm :form="form">
    <UFormField v-slot="{ model }" data-testid="email-field" name="email" label="Email">
      <UInput v-bind="model" data-testid="email-input" />
    </UFormField>

    <button type="submit" data-testid="submit">Submit</button>
  </UForm>
</template>
