import { inject, provide, type InjectionKey, type Ref } from "vue"
import type { ValidateOn } from "./types"

export interface FormContext {
  validateOn: () => ValidateOn
  disabled: () => boolean
  submitAttempted: Ref<boolean>
}

const formContextKey: InjectionKey<FormContext> = Symbol("nuxt-ui-forms:form-context")

export const provideFormContext = (context: FormContext) => {
  provide(formContextKey, context)
}

export const injectFormContext = () => inject(formContextKey, undefined)
