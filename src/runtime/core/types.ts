import type { Component, MaybeRefOrGetter, Ref } from "vue"

export type FieldEventType = "blur" | "focus" | "change" | "input"
export type ValidateOn = "blur" | "touched" | "dirty"

export interface FieldOptions {
  name: string
  fullName: string
  label?: string
  description?: string
  required?: boolean
  disabled?: MaybeRefOrGetter<boolean | undefined>
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

export interface FormHandle {
  id: string
  submitAttempted: Ref<boolean>
  submit(handler: (data: unknown) => void | Promise<void>): (event?: Event) => Promise<void>
  reset(): void
}

export interface ArrayHandle {
  items: Readonly<Ref<readonly string[]>>
  add(count?: number): void
  remove(index: number): void
  move(from: number, to: number): void
  swap(a: number, b: number): void
  insert(index: number, count?: number): void
  Iteration: Component
}

export interface FormAdapter {
  name: string
  useForm(): FormHandle
  useField(options: FieldOptions): FieldHandle
  useGroup(options: { name: string }): void
  useArray(options: { name: string; min?: number; max?: number }): ArrayHandle
}
