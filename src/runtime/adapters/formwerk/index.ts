import { computed } from "vue"
import { useCustomControl, useFormContext, useFormField, useFormGroup, useFormRepeater } from "@formwerk/core"
import type { ArrayHandle, ArrayOptions, FieldHandle, FieldOptions, FormAdapter, FormHandle } from "../../core/types"

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
    snapshot: () => ({
      values: form.values,
      errors: Object.fromEntries(form.getIssues().map(({ path, messages }) => [path, [...messages]])),
      valid: form.isValid(),
      dirty: form.isDirty(),
      submitting: form.isSubmitting.value,
    }),
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

// useFormRepeater ignores parent path prefixes (groups, iterations), so it needs the absolute path.
const useArray = ({ fullName, min, max }: ArrayOptions): ArrayHandle => {
  const repeater = useFormRepeater({ name: fullName, min, max })

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
