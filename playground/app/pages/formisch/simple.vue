<script lang="ts">
  import { getInput, reset, useForm } from "@formisch/vue"
  import * as v from "valibot"

  const schema = v.object({
    name: v.pipe(v.string("Name is required"), v.minLength(2, "Name must be at least 2 characters")),
    email: v.pipe(v.string("Enter a valid email address"), v.email("Enter a valid email address")),
    acceptTerms: v.pipe(
      v.boolean("You must accept the terms"),
      v.check((accepted) => accepted, "You must accept the terms"),
    ),
    newsletter: v.boolean(),
  })
</script>

<script setup lang="ts">
  const form = useForm({ schema, initialInput: { newsletter: false } })
  const values = computed(() => getInput(form))
  const formProps = { id: "Simple Form", form }
  const toast = useToast()
  const submitted = ref<unknown>()

  const onSubmit = async ({ data }: { data: unknown }) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    submitted.value = data
    toast.add({ title: "Form submitted", color: "success" })
  }

  const onReset = () => {
    reset(form)
    submitted.value = undefined
  }
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Simple</h1>
      <p class="mt-1 text-muted">
        Formisch's default modes: <code>validate: "submit"</code> computes errors on the first submit, then
        <code>revalidate: "input"</code> updates them while you type. Before that first submit there is nothing for
        <code>validate-on</code> to show.
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <UCard>
        <UForm v-slot="{ blurredFields, touchedFields, dirtyFields }" v-bind="formProps" class="space-y-4" @submit="onSubmit">
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
