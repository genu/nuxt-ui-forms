<script lang="ts">
  import { useForm } from "@formisch/vue"
  import * as v from "valibot"

  const schema = v.object({
    street: v.pipe(v.string("Street required"), v.minLength(1, "Street required")),
    address: v.object({
      street: v.pipe(v.string("Address street required"), v.minLength(1, "Address street required")),
    }),
  })
</script>

<script setup lang="ts">
  const form = useForm({ schema, validate: "initial" })

  const join = (names: ReadonlySet<string>) => [...names].sort().join(",")
</script>

<template>
  <UForm v-slot="{ blurredFields }" :form="form">
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
