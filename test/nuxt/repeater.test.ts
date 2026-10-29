import { afterEach, describe, expect, it, vi } from "vitest"
import type { VueWrapper } from "@vue/test-utils"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import GroupRepeaterForm from "../fixtures/basic/components/GroupRepeaterForm.vue"
import RepeaterForm from "../fixtures/basic/components/RepeaterForm.vue"
import { errorOf, interact, settle, textOf } from "./helpers"

const contacts = [
  { name: "alpha", email: "a@x.co" },
  { name: "", email: "b@x.co" },
  { name: "gamma", email: "bad" },
]

type Wrapper = VueWrapper

const mountRepeater = async (props: Record<string, unknown> = {}) => {
  const wrapper = await mountSuspended(RepeaterForm, { props: { initialContacts: contacts, ...props } })
  await settle()
  return wrapper
}

const click = async (wrapper: Wrapper, testId: string) => {
  await wrapper.get(`[data-testid="${testId}"]`).trigger("click")
  await settle()
}

const rowCount = (wrapper: Wrapper) => wrapper.findAll('[data-testid^="name-input-"]').length
const valueOf = (wrapper: Wrapper, testId: string) => wrapper.get<HTMLInputElement>(`[data-testid="${testId}"]`).element.value
const names = (wrapper: Wrapper) => contacts.map((_, index) => valueOf(wrapper, `name-input-${index}`))

const blur = async (wrapper: Wrapper, testId: string) => {
  await wrapper.get(`[data-testid="${testId}"]`).trigger("blur")
  await settle()
}

describe("UFormRepeater", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders one row per item and exposes isFirst/isLast", async () => {
    const wrapper = await mountRepeater()

    expect(rowCount(wrapper)).toBe(3)
    expect(textOf(wrapper, "position-0")).toBe("first")
    expect(textOf(wrapper, "position-1")).toBe("")
    expect(textOf(wrapper, "position-2")).toBe("last")
    expect(wrapper.find(".repeater-root").exists()).toBe(true)
    expect(wrapper.findAll(".repeater-item")).toHaveLength(3)
  })

  it("add / remove / move / swap / insert change the rendered rows", async () => {
    const wrapper = await mountRepeater()

    await click(wrapper, "add")
    expect(rowCount(wrapper)).toBe(4)

    await click(wrapper, "add-two")
    expect(rowCount(wrapper)).toBe(6)

    await click(wrapper, "remove-5")
    await click(wrapper, "remove-4")
    await click(wrapper, "remove-3")
    expect(rowCount(wrapper)).toBe(3)

    await click(wrapper, "move-0-2")
    expect(names(wrapper)).toEqual(["", "gamma", "alpha"])

    await click(wrapper, "swap-0-2")
    expect(names(wrapper)).toEqual(["alpha", "gamma", ""])

    await click(wrapper, "insert-1")
    expect(rowCount(wrapper)).toBe(4)
    expect(valueOf(wrapper, "name-input-0")).toBe("alpha")
    expect(valueOf(wrapper, "name-input-2")).toBe("gamma")
    expect(valueOf(wrapper, "name-input-3")).toBe("")

    await click(wrapper, "remove-0")
    expect(rowCount(wrapper)).toBe(3)
    expect(valueOf(wrapper, "name-input-1")).toBe("gamma")
  })

  it("blur in row 0 name does not mark row 1 name", async () => {
    const wrapper = await mountRepeater()

    await blur(wrapper, "name-input-0")

    expect(textOf(wrapper, "blurred")).toBe("contacts.0.name")
  })

  const interactWithRows = async () => {
    const wrapper = await mountRepeater()
    await interact(wrapper, "name-input-0", "alpha")
    await blur(wrapper, "email-input-2")
    return wrapper
  }

  it("row state is tracked per row before a remove", async () => {
    const wrapper = await interactWithRows()

    expect(textOf(wrapper, "blurred")).toBe("contacts.0.name,contacts.2.email")
    expect(errorOf(wrapper, "email-field-2")).toBe("Invalid email")
  })

  // Formwerk 0.14.4 rebuilds every row key after remove/insert, so rows remount and lose their local blurred/touched state.
  it.fails("removing a middle row keeps the other rows' error and touched state", async () => {
    const wrapper = await interactWithRows()

    await click(wrapper, "remove-1")

    expect(rowCount(wrapper)).toBe(2)
    expect(textOf(wrapper, "blurred")).toBe("contacts.0.name,contacts.1.email")
    expect(textOf(wrapper, "touched")).toContain("contacts.1.email")
    expect(errorOf(wrapper, "email-field-1")).toBe("Invalid email")
    expect(errorOf(wrapper, "email-field-0")).toBeUndefined()
  })

  it("removing a middle row re-keys the following rows' names and values", async () => {
    const wrapper = await mountRepeater()

    await click(wrapper, "remove-1")

    expect(rowCount(wrapper)).toBe(2)
    expect([valueOf(wrapper, "name-input-0"), valueOf(wrapper, "name-input-1")]).toEqual(["alpha", "gamma"])
    expect(wrapper.get<HTMLInputElement>('[data-testid="email-input-1"]').element.name).toBe("contacts.1.email")
    expect(valueOf(wrapper, "email-input-1")).toBe("bad")

    await blur(wrapper, "email-input-1")

    expect(textOf(wrapper, "blurred")).toBe("contacts.1.email")
    expect(errorOf(wrapper, "email-field-1")).toBe("Invalid email")
  })

  it("moving a row keeps its own state with it", async () => {
    const wrapper = await mountRepeater()

    await blur(wrapper, "name-input-1")
    expect(errorOf(wrapper, "name-field-1")).toBe("Name required")
    expect(textOf(wrapper, "blurred")).toBe("contacts.1.name")

    await click(wrapper, "move-0-2")

    expect(names(wrapper)).toEqual(["", "gamma", "alpha"])
    expect(textOf(wrapper, "blurred")).toBe("contacts.0.name")
    expect(errorOf(wrapper, "name-field-0")).toBe("Name required")
    expect(errorOf(wrapper, "name-field-1")).toBeUndefined()
    expect(errorOf(wrapper, "name-field-2")).toBeUndefined()
  })

  it("custom wrapper slot with Iteration still scopes names", async () => {
    const wrapper = await mountRepeater({ customWrapper: true })

    expect(wrapper.findAll("section")).toHaveLength(3)
    expect(wrapper.get<HTMLInputElement>('[data-testid="name-input-1"]').element.name).toBe("contacts.1.name")

    await blur(wrapper, "name-input-0")

    expect(textOf(wrapper, "blurred")).toBe("contacts.0.name")
  })

  it("min/max are forwarded (remove below min is a no-op)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const wrapper = await mountRepeater({ min: 3, max: 3 })

    await click(wrapper, "remove-1")
    expect(rowCount(wrapper)).toBe(3)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("since min is 3"))

    await click(wrapper, "add")
    expect(rowCount(wrapper)).toBe(3)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("since max is 3"))
  })
})

describe("UFormRepeater inside UFormGroup", () => {
  const mountNested = async (props: Record<string, unknown> = {}) => {
    const wrapper = await mountSuspended(GroupRepeaterForm, { props })
    await settle()
    return wrapper
  }

  it("renders rows from the group-prefixed initial values with group-prefixed names", async () => {
    const wrapper = await mountNested()

    expect(rowCount(wrapper)).toBe(2)
    expect(valueOf(wrapper, "email-input-1")).toBe("b@x.co")
    expect(wrapper.get<HTMLInputElement>('[data-testid="name-input-1"]').element.name).toBe("user.contacts.1.name")
  })

  it("blur and errors stay isolated to the row", async () => {
    const wrapper = await mountNested()

    await blur(wrapper, "name-input-0")

    expect(textOf(wrapper, "blurred")).toBe("user.contacts.0.name")
    expect(errorOf(wrapper, "name-field-0")).toBe("Name required")
    expect(errorOf(wrapper, "name-field-1")).toBeUndefined()
  })

  it("submits values at user.contacts.N", async () => {
    const onSubmitted = vi.fn()
    const wrapper = await mountNested({ onSubmitted })

    await interact(wrapper, "name-input-0", "alpha")
    await interact(wrapper, "name-input-1", "beta")
    await click(wrapper, "remove-0")
    await click(wrapper, "add")
    await interact(wrapper, "name-input-1", "gamma")
    await interact(wrapper, "email-input-1", "c@x.co")
    await wrapper.get("form").trigger("submit")
    await settle()

    expect(onSubmitted).toHaveBeenCalledWith({
      user: {
        contacts: [
          { name: "beta", email: "b@x.co" },
          { name: "gamma", email: "c@x.co" },
        ],
      },
    })
  })
})
