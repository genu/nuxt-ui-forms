import { afterEach, describe, expect, it, vi } from "vitest"
import { defineComponent, h, inject, provide, type Component, type InjectionKey } from "vue"
import { flushPromises, mount as baseMount, type VueWrapper } from "@vue/test-utils"
import { reset, useForm, type FormStore } from "@formisch/vue"
import * as v from "valibot"
import { adapter } from "../../src/runtime/adapters/formisch"
import type { FieldHandle, FormHandle } from "../../src/runtime/core/types"
import { runAdapterContract, type AdapterKit } from "./contract/adapter-contract"

const contacts = v.optional(v.array(v.object({ email: v.optional(v.string()) })))

const schema = v.object({
  email: v.pipe(v.string("Required"), v.minLength(1, "Required")),
  age: v.optional(v.pipe(v.string(), v.toNumber())),
  nickname: v.optional(v.string()),
  focus: v.optional(v.string()),
  change: v.optional(v.string()),
  input: v.optional(v.string()),
  contacts,
  user: v.optional(v.object({ contacts })),
  address: v.optional(v.object({ street: v.optional(v.string()) })),
})

const storeKey: InjectionKey<FormStore<typeof schema>> = Symbol("formisch-test-store")

const host = (child: Component, opts?: { initialValues?: Record<string, unknown> }) =>
  defineComponent({
    setup() {
      provide(storeKey, useForm({ schema, initialInput: opts?.initialValues, validate: "initial" }))
      return () => h(child)
    },
  })

const kit: AdapterKit = {
  adapter,
  host,
  formOptions: () => ({ form: inject(storeKey) }),
  providesSnapshot: true,
  capabilities: { disabledExcludesData: false },
}

runAdapterContract("formisch", kit)

const mounted: VueWrapper[] = []
const mount = (component: Component) => {
  const wrapper = baseMount(component)
  mounted.push(wrapper)
  return wrapper
}

const mountInForm = <T>(setup: () => T, initialValues?: Record<string, unknown>) => {
  let result!: T
  let form!: FormHandle
  const child = defineComponent({
    setup() {
      result = setup()
      return () => null
    },
  })
  const root = defineComponent({
    setup() {
      form = adapter.useForm(kit.formOptions())
      return () => h(child)
    },
  })
  mount(host(root, { initialValues }))
  return { form, result }
}

describe("formisch adapter", () => {
  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount())
    vi.restoreAllMocks()
  })

  it("useField throws a clear error for a name missing from the schema", () => {
    let error: unknown
    mountInForm(() => {
      try {
        adapter.useField({ name: "path", fullName: () => "missing.path" })
      } catch (e) {
        error = e
      }
    })

    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toContain("nuxt-ui-forms")
    expect((error as Error).message).toContain('"missing.path"')
    expect((error as Error).message).toContain("schema")
  })

  it("a row handle stays readable after its row is removed", async () => {
    let row!: FieldHandle
    const { result: array } = mountInForm(
      () => {
        row = adapter.useField({ name: "email", fullName: () => "contacts.1.email" })
        return adapter.useArray({ name: "contacts", fullName: () => "contacts" })
      },
      { email: "a@b.co", contacts: [{ email: "a" }, { email: "b" }] },
    )
    await flushPromises()

    array.remove(1)
    await flushPromises()

    expect(() => [row.value.value, row.error.value, row.touched.value, row.dirty.value]).not.toThrow()
    expect(row.touched.value).toBe(false)
  })

  it("Formisch's own reset() clears blurred", async () => {
    let store!: FormStore<typeof schema>
    const { result: email } = mountInForm(() => {
      store = inject(storeKey)!
      return adapter.useField({ name: "email", fullName: () => "email" })
    })
    await flushPromises()

    email.handleEvent("focus")
    email.handleEvent("blur")
    await flushPromises()
    expect(email.blurred.value).toBe(true)

    reset(store)
    await flushPromises()

    expect(email.blurred.value).toBe(false)
  })

  it("useForm rejects a value that is not a Formisch store", () => {
    let error: unknown
    mount(
      defineComponent({
        setup() {
          try {
            adapter.useForm({ form: { values: {} } })
          } catch (e) {
            error = e
          }
          return () => null
        },
      }),
    )

    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toContain("useForm()")
    expect((error as Error).message).toContain("<UForm :form")
  })

  it("a throwing submit handler resolves and shows the message under the root key", async () => {
    const { form } = mountInForm(() => {}, { email: "a@b.co" })
    await flushPromises()

    await expect(
      form.submit(() => {
        throw new Error("boom")
      })(),
    ).resolves.toBeUndefined()

    expect(form.snapshot!().errors[""]).toEqual(["boom"])
  })

  it("min/max guard add, insert and remove with a warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { result: array } = mountInForm(() => adapter.useArray({ name: "contacts", fullName: () => "contacts", min: 2, max: 2 }), {
      email: "a@b.co",
      contacts: [{ email: "a" }, { email: "b" }],
    })
    await flushPromises()

    array.add()
    array.insert(0)
    array.remove(0)
    await flushPromises()

    expect(array.items.value).toHaveLength(2)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("since max is 2"))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("since min is 2"))
  })
})
