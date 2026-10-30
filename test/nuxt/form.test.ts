import { afterEach, describe, expect, it, vi } from "vitest"
import { defineComponent, h, onErrorCaptured, type ShallowUnwrapRef } from "vue"
import type { Form } from "@nuxt/ui"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import { NuxtUiForm } from "#components"
import BasicForm from "#fixture/components/BasicForm.vue"
import FormWithoutUseForm from "#fixture/components/FormWithoutUseForm.vue"
import type { FormProps } from "../../src/runtime/types"
import { adapterName, errorOf, interact, settle, textOf } from "./helpers"

const submit = async (wrapper: Awaited<ReturnType<typeof mountSuspended>>) => {
  await wrapper.get("form").trigger("submit")
  await settle()
}

describe("UForm", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("UForm renders a <form> element", async () => {
    const wrapper = await mountSuspended(BasicForm)

    expect(wrapper.find("form").exists()).toBe(true)
  })

  it("@submit fires with validated data only when valid", async () => {
    const onSubmitted = vi.fn()
    const wrapper = await mountSuspended(BasicForm, { props: { showNickname: true, onSubmitted } })
    await settle()

    await submit(wrapper)
    expect(onSubmitted).not.toHaveBeenCalled()

    await interact(wrapper, "email-input", "a@b.co")
    await interact(wrapper, "nickname-input", "  bob  ")
    await submit(wrapper)

    expect(onSubmitted).toHaveBeenCalledOnce()
    expect(onSubmitted).toHaveBeenCalledWith({ email: "a@b.co", nickname: "bob" })
  })

  it('submit attempt on untouched fields shows errors under validateOn="blur"', async () => {
    const wrapper = await mountSuspended(BasicForm, { props: { validateOn: "blur" } })
    await settle()
    expect(errorOf(wrapper, "email-field")).toBeUndefined()

    await submit(wrapper)

    expect(textOf(wrapper, "blurred")).toBe("")
    expect(errorOf(wrapper, "email-field")).toBe("Invalid email")
  })

  it("disabling the form disables the Nuxt UI input", async () => {
    const wrapper = await mountSuspended(BasicForm, { props: { disabled: true, initialValues: { email: "a@b.co" } } })
    const emailInput = () => wrapper.get<HTMLInputElement>('[data-testid="email-input"]').element
    await settle()

    expect(emailInput().disabled).toBe(true)

    await wrapper.setProps({ disabled: false })
    await settle()
    expect(emailInput().disabled).toBe(false)
  })

  it.runIf(adapterName === "formwerk")("disabling the form excludes the field from submitted data", async () => {
    const onSubmitted = vi.fn()
    const wrapper = await mountSuspended(BasicForm, {
      props: { disabled: true, showNickname: true, initialValues: { email: "a@b.co", nickname: "bob" }, onSubmitted },
    })
    const emailInput = () => wrapper.get<HTMLInputElement>('[data-testid="email-input"]').element
    await settle()

    expect(emailInput().disabled).toBe(true)
    await submit(wrapper)
    expect(onSubmitted).toHaveBeenLastCalledWith({})

    await wrapper.setProps({ disabled: false })
    await settle()
    expect(emailInput().disabled).toBe(false)
    await submit(wrapper)
    expect(onSubmitted).toHaveBeenLastCalledWith({ email: "a@b.co", nickname: "bob" })

    await wrapper.setProps({ disabled: true })
    await settle()
    expect(emailInput().disabled).toBe(true)
    await submit(wrapper)
    expect(onSubmitted).toHaveBeenLastCalledWith({})
    expect(onSubmitted).toHaveBeenCalledTimes(3)
  })

  it("an async @submit handler keeps the form loading: the input is disabled until it resolves", async () => {
    let resolve!: () => void
    const onSubmitted = vi.fn(() => new Promise<void>((r) => (resolve = r)))
    const wrapper = await mountSuspended(BasicForm, { props: { initialValues: { email: "a@b.co" }, onSubmitted } })
    const emailInput = () => wrapper.get<HTMLInputElement>('[data-testid="email-input"]').element
    await settle()

    await submit(wrapper)
    expect(onSubmitted).toHaveBeenCalledOnce()
    expect(emailInput().disabled).toBe(true)

    resolve()
    await settle()
    expect(emailInput().disabled).toBe(false)
  })

  it("removing a UFormField with v-if removes its name from touchedFields/blurredFields/dirtyFields", async () => {
    const wrapper = await mountSuspended(BasicForm, { props: { showNickname: true } })
    await settle()

    await interact(wrapper, "email-input", "a@b.co")
    await interact(wrapper, "nickname-input", "bob")
    expect(textOf(wrapper, "blurred")).toBe("email,nickname")
    expect(textOf(wrapper, "touched")).toBe("email,nickname")
    expect(textOf(wrapper, "dirty")).toBe("email,nickname")

    await wrapper.setProps({ showNickname: false })
    await settle()

    expect(textOf(wrapper, "blurred")).toBe("email")
    expect(textOf(wrapper, "touched")).toBe("email")
    expect(textOf(wrapper, "dirty")).toBe("email")
  })

  it('UForm without useForm() throws an error containing "useForm()"', async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const errors: unknown[] = []
    const Boundary = defineComponent({
      setup() {
        onErrorCaptured((error) => {
          errors.push(error)
          return false
        })
        return () => h(FormWithoutUseForm)
      },
    })

    await mountSuspended(Boundary)

    expect(errors[0]).toBeInstanceOf(Error)
    expect((errors[0] as Error).message).toContain("useForm()")
    if (adapterName === "formwerk") expect(warn).toHaveBeenCalledWith(expect.stringContaining("useFormContext"))
  })

  it("Nuxt UI schema/validateOn strategies never run", async () => {
    // @ts-expect-error Nuxt UI's validateOn event list is not part of UForm's props
    const nuxtUiValidateOn: FormProps = { validateOn: ["input", "blur"] }
    expect(nuxtUiValidateOn).toBeDefined()

    const wrapper = await mountSuspended(BasicForm, { props: { validateOn: "touched" } })
    const nuxtUiForm = wrapper.getComponent(NuxtUiForm).vm as unknown as ShallowUnwrapRef<Form<any>>
    await settle()

    await interact(wrapper, "email-input", "not-an-email")
    await new Promise((resolve) => setTimeout(resolve, 350))

    expect(nuxtUiForm.errors).toEqual([])
    expect(errorOf(wrapper, "email-field")).toBe("Invalid email")

    const sentinel = [{ name: "email", message: "set outside Nuxt UI validation" }]
    nuxtUiForm.setErrors(sentinel)
    await interact(wrapper, "email-input", "still-not-an-email")
    await new Promise((resolve) => setTimeout(resolve, 350))

    expect(nuxtUiForm.errors).toMatchObject(sentinel)
  })
})
