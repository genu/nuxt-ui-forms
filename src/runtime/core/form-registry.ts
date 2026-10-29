import { computed, inject, provide, shallowReactive, type ComputedRef, type InjectionKey } from "vue"
import type { FieldHandle } from "./types"

export interface FormRegistry {
  register(fullName: string, handle: FieldHandle): () => void
  entries(): ReadonlyMap<string, FieldHandle>
  blurredFields: ComputedRef<ReadonlySet<string>>
  touchedFields: ComputedRef<ReadonlySet<string>>
  dirtyFields: ComputedRef<ReadonlySet<string>>
}

const registryKey: InjectionKey<FormRegistry> = Symbol("nuxt-ui-forms:registry")

export const provideFormRegistry = (): FormRegistry => {
  const handles = shallowReactive(new Map<string, FieldHandle>())

  const namesWhere = (flag: "blurred" | "touched" | "dirty") =>
    computed<ReadonlySet<string>>(() => {
      const names = new Set<string>()
      for (const [name, handle] of handles) {
        if (handle[flag].value) names.add(name)
      }
      return names
    })

  const registry: FormRegistry = {
    register(fullName, handle) {
      handles.set(fullName, handle)
      return () => {
        if (handles.get(fullName) === handle) handles.delete(fullName)
      }
    },
    entries: () => handles,
    blurredFields: namesWhere("blurred"),
    touchedFields: namesWhere("touched"),
    dirtyFields: namesWhere("dirty"),
  }

  provide(registryKey, registry)
  return registry
}

export const useFormRegistry = () => inject(registryKey, undefined)
