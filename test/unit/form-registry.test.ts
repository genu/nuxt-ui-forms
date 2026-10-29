import { describe, expect, it } from "vitest"
import { computed, defineComponent, h, ref } from "vue"
import { mount } from "@vue/test-utils"
import { provideFormRegistry, useFormRegistry, type FormRegistry } from "../../src/runtime/core/form-registry"
import type { FieldHandle } from "../../src/runtime/core/types"

const createHandle = (flags: Partial<Record<"touched" | "blurred" | "dirty", boolean>> = {}): FieldHandle => ({
  value: ref(),
  setValue: () => {},
  error: ref(),
  touched: ref(flags.touched ?? false),
  blurred: ref(flags.blurred ?? false),
  dirty: ref(flags.dirty ?? false),
  handleEvent: () => {},
})

const mountRegistry = () => {
  let registry!: FormRegistry
  mount(
    defineComponent({
      setup() {
        registry = provideFormRegistry()
        return () => h("div")
      },
    }),
  )
  return registry
}

describe("form registry", () => {
  it("collects names by flag", () => {
    const registry = mountRegistry()
    registry.register("email", createHandle({ blurred: true, touched: true }))
    registry.register("name", createHandle({ dirty: true }))

    expect([...registry.blurredFields.value]).toEqual(["email"])
    expect([...registry.touchedFields.value]).toEqual(["email"])
    expect([...registry.dirtyFields.value]).toEqual(["name"])
  })

  it("removes a field when unregistered", () => {
    const registry = mountRegistry()
    const unregister = registry.register("email", createHandle({ blurred: true }))
    expect(registry.blurredFields.value.has("email")).toBe(true)

    unregister()

    expect(registry.blurredFields.value.has("email")).toBe(false)
  })

  it("exposes current registrations through entries()", () => {
    const registry = mountRegistry()
    const email = createHandle()
    const name = createHandle()
    const paths = computed(() => [...registry.entries().keys()])

    const unregisterEmail = registry.register("email", email)
    registry.register("name", name)

    expect(paths.value).toEqual(["email", "name"])
    expect(registry.entries().get("email")).toBe(email)

    unregisterEmail()

    expect(paths.value).toEqual(["name"])
    expect(registry.entries().has("email")).toBe(false)
  })

  it("updates when a handle ref flips", () => {
    const registry = mountRegistry()
    const handle = createHandle()
    registry.register("email", handle)
    expect(registry.dirtyFields.value.has("email")).toBe(false)

    handle.dirty.value = true

    expect(registry.dirtyFields.value.has("email")).toBe(true)
  })

  it("is injectable by descendants and absent without a provider", () => {
    let injected: FormRegistry | undefined
    let registry!: FormRegistry
    const Child = defineComponent({
      setup() {
        injected = useFormRegistry()
        return () => h("span")
      },
    })
    mount(
      defineComponent({
        setup() {
          registry = provideFormRegistry()
          return () => h(Child)
        },
      }),
    )
    expect(injected).toBe(registry)

    mount(Child)
    expect(injected).toBeUndefined()
  })
})
