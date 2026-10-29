import { computed, defineComponent, h, inject, provide, ref, useId, watch, type InjectionKey, type PropType, type Ref } from "vue"
import {
  getDeepErrorEntries,
  getInput,
  handleSubmit,
  insert,
  move,
  remove,
  reset,
  swap,
  useField as useFormischField,
  useFieldArray,
  type FormStore,
} from "@formisch/vue"
import { getFieldStore, INTERNAL, type Path } from "@formisch/vue/internals"
import type { ArrayHandle, ArrayOptions, FieldHandle, FieldOptions, FormAdapter, FormHandle, UseFormOptions } from "../../core/types"
import { toPath } from "./path"

interface FormischContext {
  store: FormStore
  resetCount: Ref<number>
}

const contextKey: InjectionKey<FormischContext> = Symbol("nuxt-ui-forms:formisch")

const isFormStore = (value: unknown): value is FormStore => typeof value === "object" && value !== null && INTERNAL in value

const fieldStoreExists = (store: FormStore, path: Path) => {
  try {
    return getFieldStore(store[INTERNAL], path) !== undefined
  } catch {
    return false
  }
}

const useForm = ({ form }: UseFormOptions): FormHandle => {
  if (!isFormStore(form)) {
    throw new Error('nuxt-ui-forms: no Formisch form found. Pass the store from useForm() in @formisch/vue to <UForm :form="form">.')
  }

  const store = form
  const resetCount = ref(0)
  provide(contextKey, { store, resetCount })

  return {
    id: useId(),
    submitAttempted: computed(() => store.isSubmitted),
    submit: (handler) => {
      const submit = handleSubmit(store, (output) => handler(output))
      return () => submit()
    },
    reset: () => {
      reset(store)
      resetCount.value++
    },
    snapshot: () => ({
      values: getInput(store),
      errors: Object.fromEntries(getDeepErrorEntries(store).map(({ path, errors }) => [path.join("."), [...errors]])),
      valid: store.isValid,
      dirty: store.isDirty,
      submitting: store.isSubmitting,
    }),
  }
}

const useDetachedField = (): FieldHandle => {
  const value = ref<unknown>()

  return {
    value,
    setValue: (next) => {
      value.value = next
    },
    error: computed(() => undefined),
    touched: ref(false),
    blurred: ref(false),
    dirty: ref(false),
    handleEvent: () => {},
  }
}

const useField = ({ fullName }: FieldOptions): FieldHandle => {
  const context = inject(contextKey, undefined)
  if (!context) return useDetachedField()

  const { store, resetCount } = context
  const path = computed(() => toPath(fullName()))

  try {
    getFieldStore(store[INTERNAL], path.value)
  } catch {
    throw new Error(`nuxt-ui-forms: field "${fullName()}" is not in the Formisch form's schema.`)
  }

  const field = useFormischField(store, () => ({ path: path.value as never }))
  const exists = computed(() => fieldStoreExists(store, path.value))
  const blurred = ref(false)
  watch(resetCount, () => (blurred.value = false))

  return {
    value: computed(() => (exists.value ? field.input : undefined)),
    setValue: (value) => {
      if (exists.value) field.input = value as never
    },
    error: computed(() => (exists.value ? (field.errors?.[0] ?? undefined) : undefined)),
    touched: computed(() => exists.value && field.isTouched),
    blurred,
    dirty: computed(() => exists.value && field.isDirty),
    handleEvent: (type) => {
      if (!exists.value) return
      if (type === "blur") {
        blurred.value = true
        field.props.onBlur()
        return
      }
      field.props.onFocus()
      if (type === "change") field.props.onChange(new Event("change"))
    },
  }
}

const useGroup = () => {}

const Iteration = defineComponent({
  name: "FormischIteration",
  props: {
    index: Number,
    as: { type: String as PropType<string>, required: false },
  },
  setup(props, { slots, attrs }) {
    return () => (props.as ? h(props.as, attrs, { default: () => slots.default?.() }) : slots.default?.())
  },
})

const useArray = ({ fullName, min, max }: ArrayOptions): ArrayHandle => {
  const context = inject(contextKey, undefined)
  if (!context) throw new Error("nuxt-ui-forms: UFormRepeater must be rendered inside a UForm.")

  const { store } = context
  const path = computed(() => toPath(fullName()))
  const array = useFieldArray(store, () => ({ path: path.value as never }))
  const items = computed(() => array.items)

  const canAdd = (count: number) => max === undefined || items.value.length + count <= max
  const canRemove = () => min === undefined || items.value.length - 1 >= min

  return {
    items,
    add: (count = 1) => {
      if (!canAdd(count)) return console.warn(`Cannot add ${count} item(s) to repeater since max is ${max}`)
      for (let i = 0; i < count; i++) insert(store, { path: path.value as never })
    },
    remove: (index) => {
      if (!canRemove()) return console.warn(`Cannot remove item from repeater since min is ${min}`)
      remove(store, { path: path.value as never, at: index })
    },
    move: (from, to) => move(store, { path: path.value as never, from, to }),
    swap: (a, b) => swap(store, { path: path.value as never, at: a, and: b }),
    insert: (index) => {
      if (!canAdd(1)) return console.warn(`Cannot insert item to repeater since max is ${max}`)
      insert(store, { path: path.value as never, at: index })
    },
    Iteration,
  }
}

export const adapter: FormAdapter = {
  name: "formisch",
  useForm,
  useField,
  useGroup,
  useArray,
}
