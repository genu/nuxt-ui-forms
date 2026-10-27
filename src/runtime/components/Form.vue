<script lang="ts">
  import { provideFormContext } from "../core/form-context"
  import { provideFormRegistry } from "../core/form-registry"
  import { useAdapter } from "../core/use-adapter"
  import type { ValidateOn } from "../core/types"

  export interface FormProps {
    validateOn?: ValidateOn
    disabled?: boolean
    id?: string
  }

  export interface FormSlots {
    default(props: { blurredFields: ReadonlySet<string>; touchedFields: ReadonlySet<string>; dirtyFields: ReadonlySet<string> }): any
  }

  export interface FormEmits {
    submit: [event: { data: unknown }]
  }
</script>

<script setup lang="ts">
  const { validateOn = "blur", disabled = false, id } = defineProps<FormProps>()
  const emit = defineEmits<FormEmits>()
  defineSlots<FormSlots>()

  const form = useAdapter().useForm()
  const { blurredFields, touchedFields, dirtyFields } = provideFormRegistry()

  provideFormContext({
    validateOn: () => validateOn,
    disabled: () => disabled,
    submitAttempted: form.submitAttempted,
  })

  const onSubmit = () => form.submit((data) => emit("submit", { data }))()
</script>

<template>
  <NuxtUiForm :id="id ?? form.id" :validate-on="[]" :validate-on-input-delay="0" :disabled="disabled" @submit="onSubmit">
    <slot :blurred-fields="blurredFields" :touched-fields="touchedFields" :dirty-fields="dirtyFields" />
  </NuxtUiForm>
</template>
