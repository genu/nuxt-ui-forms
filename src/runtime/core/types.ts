import type { Component, MaybeRefOrGetter, Ref } from "vue"

export type FieldEventType = "blur" | "focus" | "change" | "input"
export type ValidateOn = "blur" | "touched" | "dirty"

export interface FieldOptions {
  /** Relative name; the library may prefix it through its own group or iteration context. */
  name: string
  /** Absolute path, reactive. */
  fullName: () => string
  label?: string
  description?: string
  disabled?: MaybeRefOrGetter<boolean | undefined>
}

export interface ArrayOptions {
  name: string
  /** Absolute path, reactive. */
  fullName: () => string
  min?: number
  max?: number
}

export interface FieldHandle {
  value: Ref<unknown>
  setValue(value: unknown): void
  error: Ref<string | undefined>
  touched: Ref<boolean>
  blurred: Ref<boolean>
  dirty: Ref<boolean>
  handleEvent(type: FieldEventType): void
}

export interface FormLevelSnapshot {
  values: unknown
  /** Messages keyed by dot-separated full path. */
  errors: Record<string, string[]>
  valid?: boolean
  dirty?: boolean
  submitting?: boolean
}

export interface FormHandle {
  id: string
  submitAttempted: Ref<boolean>
  submit(handler: (data: unknown) => void | Promise<void>): (event?: Event) => Promise<void>
  reset(): void
  snapshot?(): FormLevelSnapshot
}

export interface ArrayHandle {
  items: Readonly<Ref<readonly string[]>>
  add(count?: number): void
  remove(index: number): void
  move(from: number, to: number): void
  swap(a: number, b: number): void
  insert(index: number): void
  /** Renders one row; takes `index` and `as` props and a default slot. */
  Iteration: Component
}

export interface UseFormOptions {
  /** The library's form, passed through `UForm`'s `form` prop. */
  form?: unknown
}

export interface FormAdapter {
  name: string
  useForm(options: UseFormOptions): FormHandle
  useField(options: FieldOptions): FieldHandle
  useGroup(options: { name: string }): void
  useArray(options: ArrayOptions): ArrayHandle
}
