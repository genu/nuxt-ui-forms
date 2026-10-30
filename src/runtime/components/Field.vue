<script lang="ts">
  import { computed, inject, onBeforeUnmount, onMounted, watch } from "vue"
  import type { FormEvent, FormFieldProps } from "@nuxt/ui"
  import { isErrorVisible } from "../core/error-visibility"
  import { injectFormContext } from "../core/form-context"
  import { useFormRegistry } from "../core/form-registry"
  import { resolveFieldName, resolveFullName, useNameScope } from "../core/name-scope"
  import { formBusInjectionKey } from "../core/nuxt-ui-keys"
  import { pickRootAttrs } from "../core/root-attrs"
  import { useAdapter } from "../core/use-adapter"

  export type FieldProps = Omit<FormFieldProps, "validateOnInputDelay" | "errorPattern" | "eagerValidation" | "error" | "name"> & {
    name: string
  }

  export interface FieldSlots {
    default(props: {
      model: { modelValue: any; "onUpdate:modelValue": (value: any) => void }
      setValue: (value: any) => void
      value: any
      isTouched: boolean
      isBlurred: boolean
      isDirty: boolean
    }): any
  }
</script>

<script setup lang="ts">
  const props = defineProps<FieldProps>()
  defineSlots<FieldSlots>()
  defineOptions({ inheritAttrs: false })

  const scope = useNameScope()
  const fullName = computed(() => resolveFullName(resolveFieldName(props), scope))
  const form = injectFormContext()
  const registry = useFormRegistry()
  const bus = inject(formBusInjectionKey, undefined)

  const field = useAdapter().useField({
    name: resolveFieldName(props),
    fullName: () => fullName.value,
    label: props.label,
    description: props.description,
    disabled: form?.disabled,
  })
  const { value, setValue, touched, blurred, dirty } = field

  if (registry) {
    watch(fullName, (name, _, onCleanup) => onCleanup(registry.register(name, field)), { immediate: true })
  }

  const onBusEvent = (event: FormEvent<any>) => {
    switch (event.type) {
      case "blur":
      case "focus":
      case "change":
      case "input":
        if (event.name === fullName.value) field.handleEvent(event.type)
    }
  }
  onMounted(() => bus?.on(onBusEvent))
  onBeforeUnmount(() => bus?.off(onBusEvent))

  const error = computed(() => {
    const visible = isErrorVisible({
      validateOn: form?.validateOn() ?? "blur",
      submitAttempted: form?.submitAttempted.value ?? false,
      touched: touched.value,
      blurred: blurred.value,
      dirty: dirty.value,
    })

    return visible ? field.error.value : undefined
  })

  const slotProps = computed(() => ({
    model: { modelValue: value.value, "onUpdate:modelValue": setValue },
    setValue,
    value: value.value,
    isTouched: touched.value,
    isBlurred: blurred.value,
    isDirty: dirty.value,
  }))
</script>

<template>
  <NuxtUiFormField v-bind="{ ...props, ...pickRootAttrs($attrs) }" :name="fullName" :error="error">
    <slot v-bind="slotProps" />
  </NuxtUiFormField>
</template>
