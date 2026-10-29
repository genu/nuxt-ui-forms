import type { FieldSnapshot, FormSnapshot } from "../../src/runtime/devtools/snapshot"

export type FlagColor = "primary" | "success" | "warning" | "error" | "info"

export interface StateFlag {
  label: string
  active: boolean
  color?: FlagColor
}

export const formFlags = ({ valid, dirty, submitting, submitAttempted }: FormSnapshot["state"]): StateFlag[] => [
  ...(valid === undefined ? [] : [{ label: valid ? "valid" : "invalid", active: true, color: valid ? "success" : "error" } as const]),
  { label: "submit attempted", active: submitAttempted, color: "info" },
  ...(dirty === undefined ? [] : [{ label: "dirty", active: dirty, color: "warning" } as const]),
  ...(submitting === undefined ? [] : [{ label: "submitting", active: submitting, color: "primary" } as const]),
]

export type IndicatorIcon = "valid" | "invalid" | "attempted" | "dirty" | "submitting"

const indicatorIcons: Record<string, IndicatorIcon> = {
  valid: "valid",
  invalid: "invalid",
  "submit attempted": "attempted",
  dirty: "dirty",
  submitting: "submitting",
}

export const formIndicators = (state: FormSnapshot["state"]) =>
  formFlags(state)
    .filter((flag) => flag.active)
    .map((flag) => ({ label: flag.label, icon: indicatorIcons[flag.label] ?? "dirty", color: flag.color ?? "primary" }))

export const fieldFlags = ({ touched, blurred, dirty }: FieldSnapshot): StateFlag[] => [
  { label: "touched", active: touched, color: "primary" },
  { label: "blurred", active: blurred, color: "info" },
  { label: "dirty", active: dirty, color: "warning" },
]

export const compactJson = (value: unknown) => (value === "[undefined]" ? "undefined" : JSON.stringify(value))

export const prettyJson = (value: unknown) => JSON.stringify(value, null, 2)

export const fieldErrors = ({ path, error }: FieldSnapshot, formErrors: FormSnapshot["errors"]): string[] => [
  ...new Set([...(error === undefined ? [] : [error]), ...(formErrors[path] ?? [])]),
]
