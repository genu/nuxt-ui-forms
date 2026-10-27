<script lang="ts">
  import { useForm } from "@formwerk/core"
  import { z } from "zod"

  const schema = z.object({
    street: z.string({ error: "Street required" }).min(1, "Street required"),
    address: z.object({
      street: z.string({ error: "Address street required" }).min(1, "Address street required"),
    }),
  })
</script>

<script setup lang="ts">
  useForm({ schema })

  const join = (names: ReadonlySet<string>) => [...names].sort().join(",")
</script>

<template>
  <UForm v-slot="{ blurredFields }">
    <UFormField v-slot="{ model }" data-testid="street-field" name="street" label="Street">
      <UInput v-bind="model" data-testid="street-input" />
    </UFormField>

    <UFormGroup name="address">
      <UFormField v-slot="{ model }" data-testid="address-street-field" name="street" label="Address street">
        <UInput v-bind="model" data-testid="address-street-input" />
      </UFormField>
    </UFormGroup>

    <output data-testid="blurred">{{ join(blurredFields) }}</output>
  </UForm>
</template>
