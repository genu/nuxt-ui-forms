import { computed } from "vue"
import { useCustomControl, useFormContext, useFormField, useFormGroup, useFormRepeater } from "@formwerk/core"
import type { ArrayHandle, FieldHandle, FieldOptions, FormAdapter, FormHandle } from "../../core/types"

const useForm = (): FormHandle => {
  const form = useFormContext()

  if (!form) {
    throw new Error("nuxt-ui-forms: no Formwerk form found. Call useForm() from @formwerk/core in a parent component.")
  }

  return {
    id: form.formProps.id,
    submitAttempted: form.isSubmitAttempted,
    submit: (handler) => form.handleSubmit((data) => handler(data.toObject())),
    reset: () => {
      void form.reset()
    },
  }
}

const useField = ({ name, label, description, required, disabled }: FieldOptions): FieldHandle => {
  const formField = useFormField({ path: name, label, description, disabled })
  const { field } = useCustomControl({ name, required, controlType: "NuxtUiControl", _field: formField })

  return {
    value: field.fieldValue,
    setValue: field.setValue,
    error: computed(() => field.errorMessage.value || undefined),
    touched: field.isTouched,
    blurred: field.isBlurred,
    dirty: field.isDirty,
    handleEvent: (type) => {
      if (type === "blur") field.setBlurred(true)
      else field.setTouched(true)
    },
  }
}

const useGroup = ({ name }: { name: string }) => {
  useFormGroup({ name })
}

const nextMacrotask = () => new Promise<void>((resolve) => setTimeout(resolve))

const useArray = ({ name, min, max }: { name: string; min?: number; max?: number }): ArrayHandle => {
  const repeater = useFormRepeater({ name, min, max })

  // Formwerk inserts one row at a time and shifts row values over several ticks; inserting again before that settles corrupts them.
  const insertSequentially = async (index: number, count: number) => {
    for (let offset = 0; offset < count; offset++) {
      if (offset) await nextMacrotask()
      repeater.insert(index + offset)
    }
  }

  return {
    items: repeater.items,
    add: repeater.add,
    remove: repeater.remove,
    move: repeater.move,
    swap: repeater.swap,
    insert: (index, count = 1) => {
      void insertSequentially(index, count)
    },
    Iteration: repeater.Iteration,
  }
}

export const adapter: FormAdapter = {
  name: "formwerk",
  useForm,
  useField,
  useGroup,
  useArray,
}
