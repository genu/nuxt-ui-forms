import { onBeforeUnmount, onMounted, watch } from "vue"
import { useNuxtApp } from "#app"
import type { FormRegistry } from "../core/form-registry"
import type { FormHandle } from "../core/types"
import type { FormsHub } from "./hub"
import { buildFormSnapshot } from "./snapshot"

interface FormDevtoolsOptions {
  id: () => string
  adapter: string
  form: FormHandle
  registry: FormRegistry
}

const uniqueId = (hub: FormsHub, id: string) => {
  let candidate = id
  for (let n = 2; hub.has(candidate); n++) candidate = `${id}-${n}`
  return candidate
}

export const useFormDevtools = ({ id, adapter, form, registry }: FormDevtoolsOptions) => {
  const hub = useNuxtApp().$formsDevtools as FormsHub | undefined
  if (!hub) return

  let unregister: (() => void) | undefined

  onMounted(() => {
    const registeredId = uniqueId(hub, id())
    unregister = hub.register(registeredId, () =>
      buildFormSnapshot({
        id: registeredId,
        adapter,
        submitAttempted: form.submitAttempted.value,
        form: form.snapshot?.(),
        fields: registry.entries(),
      }),
    )
  })

  onBeforeUnmount(() => unregister?.())

  watch(
    () => [
      form.submitAttempted.value,
      form.snapshot?.(),
      [...registry.entries()].map(([name, { value, error, touched, blurred, dirty }]) => [
        name,
        value.value,
        error.value,
        touched.value,
        blurred.value,
        dirty.value,
      ]),
    ],
    () => hub.notify(),
    { flush: "post", deep: true },
  )
}
