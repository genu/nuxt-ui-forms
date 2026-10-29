<script lang="ts">
  import { useForm } from "@formwerk/core"
  import { z } from "zod"

  const schema = z.object({
    email: z.email({ error: "Invalid email" }),
  })
</script>

<script setup lang="ts">
  useForm({ schema })
</script>

<template>
  <UFormField v-slot="{ model }" data-testid="email-field" name="email" label="Email">
    <UInput v-bind="model" data-testid="email-input" />
  </UFormField>
</template>
