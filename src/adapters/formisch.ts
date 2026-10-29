import type { AdapterDefinition } from "./index"

export const formisch: AdapterDefinition = {
  name: "formisch",
  peers: ["@formisch/vue", "valibot"],
  runtimeEntry: "runtime/adapters/formisch/index",
}
