<script lang="ts">
  import { useForm } from "@formwerk/core"
  import { z } from "zod"
  import type { ValidateOn } from "nuxt-ui-forms"

  interface Props {
    validateOn: ValidateOn
    description: string
  }

  const schema = z.object({
    email: z.email({ error: "Enter a valid email address" }),
    username: z.string({ error: "Username is required" }).min(3, "Username must be at least 3 characters"),
  })
</script>

<script setup lang="ts">
  const { validateOn, description } = defineProps<Props>()

  useForm({ schema })
  const toast = useToast()

  const onSubmit = () => {
    toast.add({ title: `Submitted (${validateOn})`, color: "success" })
  }
</script>

<template>
  <UCard :data-demo="validateOn">
    <template #header>
      <h2 class="font-mono font-semibold">validate-on="{{ validateOn }}"</h2>
      <p class="mt-1 text-sm text-muted">{{ description }}</p>
    </template>

    <UForm v-slot="{ blurredFields, touchedFields, dirtyFields }" :validate-on="validateOn" class="space-y-4" @submit="onSubmit">
      <UFormField v-slot="{ model }" name="email" label="Email">
        <UInput v-bind="model" class="w-full" />
      </UFormField>
      <UFormField v-slot="{ model }" name="username" label="Username">
        <UInput v-bind="model" class="w-full" />
      </UFormField>

      <UButton type="submit" label="Submit" />

      <USeparator />

      <FormState :blurred="blurredFields" :touched="touchedFields" :dirty="dirtyFields" />
    </UForm>
  </UCard>
</template>
