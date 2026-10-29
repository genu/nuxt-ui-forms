import { afterEach, describe, expect, it, vi } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import StrayAttrsForm from "../fixtures/basic/components/StrayAttrsForm.vue"
import { errorOf, settle } from "./helpers"

const mountStray = async (props: InstanceType<typeof StrayAttrsForm>["$props"] = {}) => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  const wrapper = await mountSuspended(StrayAttrsForm, { props })
  await settle()
  return { wrapper, warn }
}

describe("attribute fall-through", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("a UForm with :schema and :validate attrs still submits library-validated data and Nuxt UI validation never runs", async () => {
    const validate = vi.fn(() => [{ name: "email", message: "from Nuxt UI validate" }])
    const onSubmitted = vi.fn()
    const { wrapper } = await mountStray({ validate, onSubmitted })

    await wrapper.get("form").trigger("submit")
    await settle()

    expect(validate).not.toHaveBeenCalled()
    expect(onSubmitted).toHaveBeenCalledWith({ email: "a@b.co" })
    expect(wrapper.get("form").attributes("data-testid")).toBe("form")
  })

  it("warns once in dev that schema, state and validate belong to the form library", async () => {
    const { warn } = await mountStray()

    expect(warn).toHaveBeenCalledOnce()
    const [message] = warn.mock.calls[0]!
    expect(message).toContain("schema")
    expect(message).toContain("state")
    expect(message).toContain("validate")
    expect(message).toContain("form library")
  })

  it("a stray error attr on UFormField does not override the library error", async () => {
    const { wrapper } = await mountStray()
    const input = wrapper.get('[data-testid="email-input"]')

    expect(errorOf(wrapper, "email-field")).toBeUndefined()

    await input.setValue("x")
    await input.trigger("blur")
    await settle()

    expect(errorOf(wrapper, "email-field")).toBe("Invalid email")
  })
})
