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

const useField = ({ name, label, description, disabled }: FieldOptions): FieldHandle => {
  const formField = useFormField({ path: name, label, description, disabled })
  const { field } = useCustomControl({ name, controlType: "NuxtUiControl", _field: formField })

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

const useArray = ({ name, min, max }: { name: string; min?: number; max?: number }): ArrayHandle => {
  const repeater = useFormRepeater({ name, min, max })

  return {
    items: repeater.items,
    add: repeater.add,
    remove: repeater.remove,
    move: repeater.move,
    swap: repeater.swap,
    insert: repeater.insert,
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
