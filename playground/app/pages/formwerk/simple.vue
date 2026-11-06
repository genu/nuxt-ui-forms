<script lang="ts">
  import { useForm } from "@formwerk/core"
  import { z } from "zod"

  const schema = z.object({
    name: z.string({ error: "Name is required" }).min(2, "Name must be at least 2 characters"),
    email: z.email({ error: "Enter a valid email address" }),
    acceptTerms: z.boolean({ error: "You must accept the terms" }).refine((accepted) => accepted, "You must accept the terms"),
    newsletter: z.boolean(),
  })
</script>

<script setup lang="ts">
  const { values, reset } = useForm({ id: "Simple Form", schema, initialValues: { newsletter: false } })
  const toast = useToast()
  const submitted = ref<unknown>()

  const onSubmit = async ({ data }: { data: unknown }) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    submitted.value = data
    toast.add({ title: "Form submitted", color: "success" })
  }

  const onReset = async () => {
    await reset()
    submitted.value = undefined
  }
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Simple</h1>
      <p class="mt-1 text-muted">
        <code>validate-on="blur"</code> (the default): an error shows once its field has lost focus, or after a submit attempt.
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <UCard>
        <UForm v-slot="{ blurredFields, touchedFields, dirtyFields }" class="space-y-4" @submit="onSubmit">
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField v-slot="{ model }" name="name" label="Name" required>
              <UInput v-bind="model" class="w-full" />
            </UFormField>
            <UFormField v-slot="{ model }" name="email" label="Email" required>
              <UInput v-bind="model" type="email" class="w-full" />
            </UFormField>
          </div>

          <UFormField v-slot="{ model }" name="acceptTerms">
            <UCheckbox v-bind="model" label="I accept the terms and conditions" />
          </UFormField>

          <UFormField v-slot="{ model }" name="newsletter">
            <USwitch v-bind="model" label="Subscribe to the newsletter" />
          </UFormField>

          <div class="flex gap-2">
            <UButton type="submit" label="Submit" />
            <UButton label="Reset" color="neutral" variant="ghost" @click="onReset" />
          </div>

          <USeparator />

          <FormState :values="values" :blurred="blurredFields" :touched="touchedFields" :dirty="dirtyFields" />
        </UForm>
      </UCard>

      <UCard>
        <h2 class="font-semibold">Last submit</h2>
        <pre data-state="submitted" class="mt-2 overflow-x-auto text-xs">{{ submitted ?? "nothing yet" }}</pre>
      </UCard>
    </div>
  </div>
</template>
