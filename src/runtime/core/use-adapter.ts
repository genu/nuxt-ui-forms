import { adapter } from "#nuxt-ui-forms/adapter"
import type { FormAdapter } from "./types"

export const useAdapter = (): FormAdapter => {
  return adapter
}
