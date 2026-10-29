import type { Nuxt } from "@nuxt/schema"
import { formwerk } from "./formwerk"

export interface AdapterDefinition {
  name: string
  peer: string
  runtimeEntry: string
  setup?: (nuxt: Nuxt) => void
}

const adapters: Record<string, AdapterDefinition> = {
  formwerk,
}

export const resolveAdapter = (name: string): AdapterDefinition => {
  const adapter = adapters[name]

  if (!adapter) {
    throw new Error(`Unknown form adapter "${name}". Available adapters: ${Object.keys(adapters).join(", ")}`)
  }

  return adapter
}
