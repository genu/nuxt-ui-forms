import { readonly, shallowRef, type Ref } from "vue"
import type { FormSnapshot } from "./snapshot"

export interface FormsHub {
  register(id: string, read: () => FormSnapshot): () => void
  has(id: string): boolean
  list(): FormSnapshot[]
  subscribe(cb: () => void): () => void
  subscriberCount: Readonly<Ref<number>>
  notify(): void
}

export interface FormsHubOptions {
  throttleMs?: number
}

const attempt = <T>(fn: () => T): T[] => {
  try {
    return [fn()]
  } catch {
    return []
  }
}

export const createFormsHub = ({ throttleMs = 50 }: FormsHubOptions = {}): FormsHub => {
  const readers = new Map<string, () => FormSnapshot>()
  const subscribers = new Set<() => void>()
  const subscriberCount = shallowRef(0)
  let pending: ReturnType<typeof setTimeout> | undefined

  const flush = () => {
    pending = undefined
    subscribers.forEach((cb) => attempt(cb))
  }

  const notify = () => {
    pending ??= setTimeout(flush, throttleMs)
  }

  return {
    register(id, read) {
      readers.set(id, read)
      notify()
      return () => {
        if (readers.get(id) !== read) return
        readers.delete(id)
        notify()
      }
    },
    has: (id) => readers.has(id),
    list: () => [...readers.values()].flatMap((read) => attempt(read)),
    subscribe(cb) {
      subscribers.add(cb)
      subscriberCount.value = subscribers.size
      return () => {
        subscribers.delete(cb)
        subscriberCount.value = subscribers.size
      }
    },
    subscriberCount: readonly(subscriberCount),
    notify,
  }
}
