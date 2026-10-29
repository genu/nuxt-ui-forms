import type { NuxtDevtoolsHostClient } from "@nuxt/devtools-kit/types"
import type { FormsHub } from "../../src/runtime/devtools/hub"
import type { FormSnapshot } from "../../src/runtime/devtools/snapshot"

type HostWindow = Window & { __NUXT_DEVTOOLS_HOST__?: NuxtDevtoolsHostClient }

const RETRY_MS = 1000

const findHub = (): FormsHub | undefined => {
  try {
    return (window.parent as HostWindow | null)?.__NUXT_DEVTOOLS_HOST__?.nuxt?.$formsDevtools as FormsHub | undefined
  } catch {
    return undefined
  }
}

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))

export const useFormsHub = () => {
  const forms = ref<FormSnapshot[]>([])
  const connected = ref(false)
  const selectedId = ref<string>()
  const selected = computed(() => forms.value.find(({ id }) => id === selectedId.value) ?? forms.value[0])

  let unsubscribe: (() => void) | undefined
  let retry: ReturnType<typeof setInterval> | undefined

  const disconnect = () => {
    clearInterval(retry)
    unsubscribe?.()
    unsubscribe = undefined
  }

  const connect = () => {
    const hub = findHub()
    if (!hub) return false
    const refresh = () => {
      if (!window.parent) return disconnect()
      forms.value = copy(hub.list())
    }
    unsubscribe = hub.subscribe(refresh)
    connected.value = true
    refresh()
    return true
  }

  onMounted(() => {
    window.addEventListener("pagehide", disconnect)
    if (!connect()) retry = setInterval(() => connect() && clearInterval(retry), RETRY_MS)
  })

  onBeforeUnmount(() => {
    disconnect()
    window.removeEventListener("pagehide", disconnect)
  })

  return { forms, connected, selectedId, selected }
}
