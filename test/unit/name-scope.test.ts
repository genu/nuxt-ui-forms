import { describe, expect, it } from "vitest"
import { defineComponent, h, ref, type Component } from "vue"
import { mount } from "@vue/test-utils"
import { provideNameScope, resolveFieldName, resolveFullName, useNameScope } from "../../src/runtime/core/name-scope"

const Consumer = defineComponent({
  setup() {
    return () => h("span", resolveFullName("email"))
  },
})

const scope = (prefix: string | (() => string), child: Component) =>
  defineComponent({
    setup() {
      provideNameScope(prefix)
      return () => h(child)
    },
  })

describe("name scope", () => {
  it("returns the bare name without a scope", () => {
    expect(mount(Consumer).text()).toBe("email")
  })

  it("prefixes with the provided scope", () => {
    expect(mount(scope("address", Consumer)).text()).toBe("address.email")
  })

  it("joins nested scopes", () => {
    const tree = scope("contacts.1", scope("address", Consumer))
    expect(mount(tree).text()).toBe("contacts.1.address.email")
  })

  it("ignores an empty scope", () => {
    expect(mount(scope("", Consumer)).text()).toBe("email")
  })

  it("reflects a reactive prefix change", async () => {
    const prefix = ref("contacts.0")
    const wrapper = mount(scope(() => prefix.value, Consumer))
    expect(wrapper.text()).toBe("contacts.0.email")

    prefix.value = "contacts.1"
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toBe("contacts.1.email")
  })

  it("resolves against a captured scope after setup, following prefix changes", () => {
    const prefix = ref("contacts.0")
    let scopeGetter!: () => string
    const Capture = defineComponent({
      setup() {
        scopeGetter = useNameScope()
        return () => null
      },
    })
    mount(scope(() => prefix.value, Capture))

    expect(resolveFullName("email", scopeGetter)).toBe("contacts.0.email")
    prefix.value = "contacts.1"
    expect(resolveFullName("email", scopeGetter)).toBe("contacts.1.email")
  })

  it("resolveFieldName reads the field name from props", () => {
    expect(resolveFieldName({ name: "email" })).toBe("email")
  })
})
