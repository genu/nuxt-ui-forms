<script lang="ts">
  import { useForm } from "@formwerk/core"
  import { z } from "zod"

  const schema = z.object({
    name: z.string({ error: "Name is required" }).min(1, "Name is required"),
    address: z.object({
      street: z.string({ error: "Street is required" }).min(1, "Street is required"),
      city: z.string({ error: "City is required" }).min(1, "City is required"),
      zipCode: z.string({ error: "Zip code is required" }).regex(/^\d{5}$/, "Zip code must be 5 digits"),
    }),
    company: z.object({
      name: z.string({ error: "Company name is required" }).min(1, "Company name is required"),
      employees: z
        .array(
          z.object({
            name: z.string({ error: "Employee name is required" }).min(1, "Employee name is required"),
            role: z.string({ error: "Role is required" }).min(1, "Role is required"),
          }),
        )
        .min(1, "Add at least one employee"),
    }),
  })
</script>

<script setup lang="ts">
  const { values } = useForm({
    id: "Nested Form",
    schema,
    initialValues: { company: { employees: [{ name: "", role: "" }] } },
  })
  const toast = useToast()
  const submitted = ref<unknown>()

  const onSubmit = ({ data }: { data: unknown }) => {
    submitted.value = data
    toast.add({ title: "Form submitted", color: "success" })
  }
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Nested</h1>
      <p class="mt-1 text-muted">
        Fields inside <code>UFormGroup</code> use relative names. The group prefixes them, so <code>street</code> becomes
        <code>address.street</code>. The employees repeater sits inside the <code>company</code> group.
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <UCard>
        <UForm v-slot="{ blurredFields, touchedFields, dirtyFields }" class="space-y-6" @submit="onSubmit">
          <UFormField v-slot="{ model }" name="name" label="Full name">
            <UInput v-bind="model" class="w-full" />
          </UFormField>

          <fieldset class="space-y-3">
            <legend class="font-medium">Address</legend>
            <UFormGroup name="address" class="grid gap-4 sm:grid-cols-3">
              <UFormField v-slot="{ model }" name="street" label="Street">
                <UInput v-bind="model" class="w-full" />
              </UFormField>
              <UFormField v-slot="{ model }" name="city" label="City">
                <UInput v-bind="model" class="w-full" />
              </UFormField>
              <UFormField v-slot="{ model }" name="zipCode" label="Zip code">
                <UInput v-bind="model" class="w-full" />
              </UFormField>
            </UFormGroup>
          </fieldset>

          <fieldset class="space-y-3">
            <legend class="font-medium">Company</legend>
            <UFormGroup name="company" class="space-y-4">
              <UFormField v-slot="{ model }" name="name" label="Company name">
                <UInput v-bind="model" class="w-full" />
              </UFormField>

              <UFormRepeater name="employees" :min="1" :ui="{ root: 'space-y-3', wrapper: 'space-y-3' }">
                <template #default="{ index, items, repeater }">
                  <div class="flex items-start gap-3">
                    <UFormField v-slot="{ model }" name="name" label="Employee" class="flex-1">
                      <UInput v-bind="model" class="w-full" />
                    </UFormField>
                    <UFormField v-slot="{ model }" name="role" label="Role" class="flex-1">
                      <UInput v-bind="model" class="w-full" />
                    </UFormField>
                    <UButton
                      icon="i-lucide-trash"
                      color="error"
                      variant="ghost"
                      class="mt-6"
                      :aria-label="`Remove employee ${index + 1}`"
                      :disabled="items.length <= 1"
                      @click="repeater.remove(index)" />
                  </div>
                </template>
                <template #trailing="{ repeater }">
                  <UButton icon="i-lucide-plus" label="Add employee" variant="outline" @click="repeater.add()" />
                </template>
              </UFormRepeater>
            </UFormGroup>
          </fieldset>

          <UButton type="submit" label="Submit" />

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
