import { defineComponent, h } from "vue"
import { useForm } from "@formwerk/core"
import { z } from "zod"
import { adapter } from "../../src/runtime/adapters/formwerk"
import { runAdapterContract, type AdapterKit } from "./contract/adapter-contract"

const schema = z.looseObject({
  email: z.string({ error: "Required" }).min(1, "Required"),
  age: z.coerce.number().optional(),
})

const kit: AdapterKit = {
  adapter,
  formOptions: () => ({}),
  providesSnapshot: true,
  capabilities: { disabledExcludesData: true },
  host: (child, opts) =>
    defineComponent({
      setup() {
        useForm({ schema, initialValues: opts?.initialValues })
        return () => h(child)
      },
    }),
}

runAdapterContract("formwerk", kit)
