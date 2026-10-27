import { fileURLToPath } from "node:url"
import type { AdapterDefinition } from "./index"

export const formwerk: AdapterDefinition = {
  name: "formwerk",
  peer: "@formwerk/core",
  runtimeEntry: "runtime/adapters/formwerk/index",
  setup(nuxt) {
    // Prevent duplicate @formwerk/core instances which break context sharing between
    // useForm() and useFormContext(). Required for dev playground and pnpm strict mode.
    nuxt.options.alias["@formwerk/core"] = fileURLToPath(import.meta.resolve("@formwerk/core"))
  },
}
