import type { Nuxt } from "@nuxt/schema"
import { formisch } from "./formisch"
import { formwerk } from "./formwerk"

export interface AdapterDefinition {
  name: string
  peers: string[]
  runtimeEntry: string
  setup?: (nuxt: Nuxt) => void
}

const adapters: Record<string, AdapterDefinition> = {
  formwerk,
  formisch,
}

export const resolveAdapter = (name: string): AdapterDefinition => {
  const adapter = adapters[name]

  if (!adapter) {
    throw new Error(`Unknown form adapter "${name}". Available adapters: ${Object.keys(adapters).join(", ")}`)
  }

  return adapter
}

export const missingPeersError = (adapter: AdapterDefinition, isResolvable: (id: string) => boolean): string | undefined => {
  const missing = adapter.peers.filter((peer) => !isResolvable(peer))
  if (!missing.length) return

  const required = missing.map((peer) => `"${peer}"`).join(", ")
  const pronoun = missing.length === 1 ? "it" : "them"

  return `[nuxt-ui-forms] The "${adapter.name}" adapter requires ${required}. Install ${pronoun} with: pnpm add ${missing.join(" ")}`
}
