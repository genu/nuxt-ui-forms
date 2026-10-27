import type { ValidateOn } from "./types"

export interface ErrorVisibilityState {
  validateOn: ValidateOn
  submitAttempted: boolean
  touched: boolean
  blurred: boolean
  dirty: boolean
}

export const isErrorVisible = ({ validateOn, submitAttempted, touched, blurred, dirty }: ErrorVisibilityState) => {
  if (submitAttempted) return true

  const gates: Record<ValidateOn, boolean> = { blur: blurred, touched, dirty }
  return gates[validateOn]
}
