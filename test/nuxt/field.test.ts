import { afterEach, describe, expect, it, vi } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import BasicForm from "../fixtures/basic/components/BasicForm.vue"
import FieldWithoutForm from "../fixtures/basic/components/FieldWithoutForm.vue"
import GroupForm from "../fixtures/basic/components/GroupForm.vue"
import { errorOf, settle, textOf } from "./helpers"

describe("UFormField", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('validateOn="blur": error hidden until the input emits blur, then visible', async () => {
    const wrapper = await mountSuspended(BasicForm, { props: { validateOn: "blur" } })
    const input = wrapper.get('[data-testid="email-input"]')
    await settle()

    await input.trigger("focus")
    await input.setValue("x")
    await settle()
    expect(errorOf(wrapper, "email-field")).toBeUndefined()

    await input.trigger("blur")
    await settle()
    expect(errorOf(wrapper, "email-field")).toBe("Invalid email")
  })

  it('validateOn="touched": hidden until focus', async () => {
    const wrapper = await mountSuspended(BasicForm, { props: { validateOn: "touched" } })
    await settle()
    expect(errorOf(wrapper, "email-field")).toBeUndefined()

    await wrapper.get('[data-testid="email-input"]').trigger("focus")
    await settle()
    expect(errorOf(wrapper, "email-field")).toBe("Invalid email")
  })

  it('validateOn="dirty": hidden until input', async () => {
    const wrapper = await mountSuspended(BasicForm, { props: { validateOn: "dirty" } })
    const input = wrapper.get('[data-testid="email-input"]')
    await settle()

    await input.trigger("focus")
    await input.trigger("blur")
    await settle()
    expect(errorOf(wrapper, "email-field")).toBeUndefined()

    await input.setValue("x")
    await settle()
    expect(errorOf(wrapper, "email-field")).toBe("Invalid email")
  })

  it('UFormGroup name="address" with UFormField name="street" shows its error under name address.street and blur only affects that field', async () => {
    const wrapper = await mountSuspended(GroupForm)
    const input = wrapper.get<HTMLInputElement>('[data-testid="address-street-input"]')
    await settle()

    expect(input.element.name).toBe("address.street")
    expect(wrapper.get<HTMLInputElement>('[data-testid="street-input"]').element.name).toBe("street")

    await input.trigger("blur")
    await settle()

    expect(textOf(wrapper, "blurred")).toBe("address.street")
    expect(errorOf(wrapper, "address-street-field")).toBe("Address street required")
    expect(errorOf(wrapper, "street-field")).toBeUndefined()
  })

  it("outside any UForm renders its label and slot, never shows library errors and logs nothing", async () => {
    const error = vi.spyOn(console, "error")
    const warn = vi.spyOn(console, "warn")
    const wrapper = await mountSuspended(FieldWithoutForm)
    const input = wrapper.get('[data-testid="email-input"]')
    await settle()

    expect(wrapper.get('[data-testid="email-field"] label').text()).toBe("Email")
    await input.trigger("focus")
    await input.setValue("x")
    await input.trigger("blur")
    await settle()

    expect(errorOf(wrapper, "email-field")).toBeUndefined()
    expect(error).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
  })
})
