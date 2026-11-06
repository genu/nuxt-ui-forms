import { describe, expect, it, vi } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import BasicForm from "#fixture/components/BasicForm.vue"
import DefaultModesForm from "#fixture/components/DefaultModesForm.vue"
import { errorOf, interact, settle } from "./helpers"

describe("Formisch adapter", () => {
  it("with Formisch's default modes, errors appear only after a submit attempt and clear on valid input", async () => {
    const wrapper = await mountSuspended(DefaultModesForm)
    const input = wrapper.get('[data-testid="email-input"]')
    await settle()

    await input.trigger("focus")
    await input.trigger("blur")
    await settle()
    expect(errorOf(wrapper, "email-field")).toBeUndefined()

    await wrapper.get("form").trigger("submit")
    await settle()
    expect(errorOf(wrapper, "email-field")).toBe("Required")

    await interact(wrapper, "email-input", "a@b.co")
    expect(errorOf(wrapper, "email-field")).toBeUndefined()
  })

  it("a throwing @submit handler ends the loading state without an unhandled rejection", async () => {
    const onSubmitted = vi.fn(async () => {
      throw new Error("boom")
    })
    const wrapper = await mountSuspended(BasicForm, { props: { initialValues: { email: "a@b.co" }, onSubmitted } })
    const emailInput = () => wrapper.get<HTMLInputElement>('[data-testid="email-input"]').element
    await settle()

    await wrapper.get("form").trigger("submit")
    await settle()

    expect(onSubmitted).toHaveBeenCalledOnce()
    expect(emailInput().disabled).toBe(false)
  })
})
