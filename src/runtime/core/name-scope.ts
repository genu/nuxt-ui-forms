import { computed, inject, provide, toValue, type InjectionKey, type MaybeRefOrGetter } from "vue"

const scopeKey: InjectionKey<() => string> = Symbol("nuxt-ui-forms:name-scope")

const joinPath = (...parts: string[]) => parts.filter(Boolean).join(".")

export const provideNameScope = (prefix: MaybeRefOrGetter<string>) => {
  const parent = inject(scopeKey, () => "")
  const scope = computed(() => joinPath(parent(), toValue(prefix)))

  provide(scopeKey, () => scope.value)
}

export const resolveFullName = (name: string) => {
  const scope = inject(scopeKey, () => "")

  return joinPath(scope(), name)
}
