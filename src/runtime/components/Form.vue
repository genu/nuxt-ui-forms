<script lang="ts">
  import { computed, useAttrs } from "vue"
  import { provideFormContext } from "../core/form-context"
  import { provideFormRegistry } from "../core/form-registry"
  import { pickRootAttrs } from "../core/root-attrs"
  import { useAdapter } from "../core/use-adapter"
  import { useFormDevtools } from "../devtools/use-form-devtools"
  import type { ValidateOn } from "../core/types"

  export interface FormProps {
    validateOn?: ValidateOn
    disabled?: boolean
    id?: string
    form?: object
    onSubmit?: (event: { data: unknown }) => void | Promise<void>
  }

  export interface FormSlots {
    default(props: { blurredFields: ReadonlySet<string>; touchedFields: ReadonlySet<string>; dirtyFields: ReadonlySet<string> }): any
  }

  const libraryOwnedAttrs = ["schema", "state", "validate"]
</script>

<script setup lang="ts">
  const { validateOn = "blur", disabled = false, id, form: libraryForm, onSubmit } = defineProps<FormProps>()
  defineSlots<FormSlots>()
  defineOptions({ inheritAttrs: false })

  if (import.meta.env.DEV) {
    const passed = libraryOwnedAttrs.filter((key) => key in useAttrs())
    if (passed.length) {
      console.warn(
        `[nuxt-ui-forms] UForm ignores ${passed.map((key) => `"${key}"`).join(", ")}: validation belongs to the form library, configure it in useForm().`,
      )
    }
  }

  const adapter = useAdapter()
  const form = adapter.useForm({ form: libraryForm })
  const registry = provideFormRegistry()
  const { blurredFields, touchedFields, dirtyFields } = registry

  provideFormContext({
    validateOn: () => validateOn,
    disabled: () => disabled,
    submitAttempted: form.submitAttempted,
  })

  const formId = () => id ?? form.id
  const nuxtUiFormProps = computed(() => ({ id: formId(), validateOn: [], validateOnInputDelay: 0, disabled }))

  if (import.meta.env.DEV) {
    useFormDevtools({ id: formId, adapter: adapter.name, form, registry })
  }

  const submit = () => form.submit((data) => onSubmit?.({ data }))()
</script>

<template>
  <NuxtUiForm v-bind="{ ...pickRootAttrs($attrs), ...nuxtUiFormProps }" @submit="submit">
    <slot :blurred-fields="blurredFields" :touched-fields="touchedFields" :dirty-fields="dirtyFields" />
  </NuxtUiForm>
</template>
