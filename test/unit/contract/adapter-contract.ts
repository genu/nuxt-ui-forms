import { afterEach, describe, expect, it, vi } from "vitest"
import { defineComponent, h, ref, type Component } from "vue"
import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils"
import type { ArrayHandle, FieldEventType, FieldHandle, FieldOptions, FormAdapter, FormHandle } from "../../../src/runtime/core/types"

export interface AdapterKit {
  adapter: FormAdapter
  host: (child: Component, opts?: { initialValues?: Record<string, unknown> }) => Component
}

type HostOptions = Parameters<AdapterKit["host"]>[1]

const field = (name: string, extra: Partial<FieldOptions> = {}): FieldOptions => ({ name, fullName: name, ...extra })

export const runAdapterContract = (name: string, kit: AdapterKit) => {
  const { adapter } = kit

  const mountInHost = <T>(setup: () => T, opts?: HostOptions): T => {
    let result!: T
    const child = defineComponent({
      setup() {
        result = setup()
        return () => null
      },
    })
    mount(kit.host(child, opts))
    return result
  }

  const mountFields = (opts?: HostOptions, ...options: FieldOptions[]) =>
    mountInHost(
      () => ({
        form: adapter.useForm(),
        fields: options.map((option) => adapter.useField(option)),
      }),
      opts,
    )

  const settleValidation = async () => {
    await new Promise((resolve) => setTimeout(resolve, 50))
    await flushPromises()
  }

  const submitWith = async (form: FormHandle) => {
    const handler = vi.fn()
    await form.submit(handler)()
    await flushPromises()
    return handler
  }

  describe(`adapter contract: ${name}`, () => {
    enableAutoUnmount(afterEach)

    it("useForm throws outside a form", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
      let error: unknown
      mount(
        defineComponent({
          setup() {
            try {
              adapter.useForm()
            } catch (e) {
              error = e
            }
            return () => null
          },
        }),
      )

      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toContain("useForm()")
      warn.mockRestore()
    })

    it("setValue updates value and marks dirty", async () => {
      const {
        fields: [email],
      } = mountFields(undefined, field("email"))
      await flushPromises()

      expect(email!.dirty.value).toBe(false)

      email!.setValue("a@b.co")
      await flushPromises()

      expect(email!.value.value).toBe("a@b.co")
      expect(email!.dirty.value).toBe(true)
    })

    it("error is set after value becomes invalid", async () => {
      const {
        fields: [email],
      } = mountFields({ initialValues: { email: "a@b.co" } }, field("email"))

      email!.setValue("b@c.co")
      await settleValidation()
      expect(email!.error.value).toBeUndefined()

      email!.setValue("")
      await vi.waitFor(() => expect(email!.error.value).toBe("Required"))
    })

    it("handleEvent('blur') sets blurred, not touched-only side effects lost", async () => {
      const {
        fields: [email],
      } = mountFields(undefined, field("email"))
      await flushPromises()

      expect(email!.blurred.value).toBe(false)

      email!.handleEvent("blur")
      await flushPromises()

      expect(email!.blurred.value).toBe(true)
    })

    it("handleEvent('focus'|'change'|'input') sets touched and leaves blurred false", async () => {
      const events: FieldEventType[] = ["focus", "change", "input"]
      const { fields } = mountFields(undefined, ...events.map((event) => field(event)))
      await flushPromises()

      events.forEach((event, index) => fields[index]!.handleEvent(event))
      await flushPromises()

      for (const handle of fields) {
        expect(handle.touched.value).toBe(true)
        expect(handle.blurred.value).toBe(false)
      }
    })

    it("submit does not call handler while invalid", async () => {
      const { form } = mountFields(undefined, field("email"))
      await flushPromises()

      expect(form.submitAttempted.value).toBe(false)

      const handler = await submitWith(form)

      expect(handler).not.toHaveBeenCalled()
      expect(form.submitAttempted.value).toBe(true)
    })

    it("submit passes validated data when valid", async () => {
      const {
        form,
        fields: [email, age],
      } = mountFields(undefined, field("email"), field("age"))

      email!.setValue("a@b.co")
      age!.setValue("42")
      await flushPromises()

      expect(form.submitAttempted.value).toBe(false)

      const handler = await submitWith(form)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({ email: "a@b.co", age: 42 })
      expect(form.submitAttempted.value).toBe(true)
    })

    it("disabled field is excluded from submitted data", async () => {
      const { form } = mountFields(
        { initialValues: { email: "a@b.co", nickname: "neo" } },
        field("email"),
        field("nickname", { disabled: true }),
      )
      await flushPromises()

      const handler = await submitWith(form)

      expect(handler).toHaveBeenCalledWith({ email: "a@b.co" })
    })

    it("disabled follows a reactive getter", async () => {
      const disabled = ref(true)
      const { form } = mountFields(
        { initialValues: { email: "a@b.co", nickname: "neo" } },
        field("email"),
        field("nickname", { disabled: () => disabled.value }),
      )
      await flushPromises()

      expect((await submitWith(form)).mock.calls[0]?.[0]).toEqual({ email: "a@b.co" })

      disabled.value = false
      await flushPromises()

      expect((await submitWith(form)).mock.calls[0]?.[0]).toEqual({ email: "a@b.co", nickname: "neo" })
    })

    it("reset clears touched, blurred, dirty", async () => {
      const {
        form,
        fields: [email],
      } = mountFields(undefined, field("email"))
      await flushPromises()

      email!.setValue("a@b.co")
      email!.handleEvent("focus")
      email!.handleEvent("blur")
      await flushPromises()

      expect([email!.touched.value, email!.blurred.value, email!.dirty.value]).toEqual([true, true, true])

      form.reset()
      await flushPromises()

      expect([email!.touched.value, email!.blurred.value, email!.dirty.value]).toEqual([false, false, false])
    })

    it("array add/remove/move/swap/insert change items and keep keys stable for untouched rows", async () => {
      const contacts = mountInHost(() => adapter.useArray({ name: "contacts" }), {
        initialValues: { contacts: [{ email: "a" }, { email: "b" }] },
      })
      await flushPromises()

      const step = async (mutate: () => void) => {
        mutate()
        await flushPromises()
        return [...contacts.items.value]
      }

      const [a, b] = contacts.items.value
      expect(contacts.items.value).toHaveLength(2)

      const added = await step(() => contacts.add())
      expect(added).toHaveLength(3)
      expect(added.slice(0, 2)).toEqual([a, b])
      const c = added[2]!
      expect([a, b]).not.toContain(c)

      const addedMany = await step(() => contacts.add(2))
      expect(addedMany).toHaveLength(5)
      expect(addedMany.slice(0, 3)).toEqual([a, b, c])

      await step(() => contacts.remove(4))
      expect(await step(() => contacts.remove(3))).toEqual([a, b, c])

      expect(await step(() => contacts.move(0, 2))).toEqual([b, c, a])
      expect(await step(() => contacts.swap(0, 2))).toEqual([a, c, b])
      expect(await step(() => contacts.remove(1))).toEqual([a, b])

      const inserted = await step(() => contacts.insert(1))
      expect(inserted).toHaveLength(3)
      expect([inserted[0], inserted[2]]).toEqual([a, b])
      expect([a, b]).not.toContain(inserted[1])

      const insertedFirst = await step(() => contacts.insert(0))
      expect(insertedFirst).toHaveLength(4)
      expect(insertedFirst.slice(1)).toEqual(inserted)
      expect(new Set(insertedFirst).size).toBe(4)
    })

    const mountContacts = (contacts: Record<string, unknown>[]) => {
      const rows: FieldHandle[] = []
      let form!: FormHandle
      let array!: ArrayHandle

      const Row = defineComponent({
        props: { index: { type: Number, required: true } },
        setup(props) {
          rows[props.index] = adapter.useField(field("email", { fullName: `contacts.${props.index}.email` }))
          return () => null
        },
      })

      const Contacts = defineComponent({
        setup() {
          form = adapter.useForm()
          array = adapter.useArray({ name: "contacts" })
          const { items, Iteration } = array
          return () => items.value.map((key, index) => h(Iteration, { key, index }, { default: () => h(Row, { index }) }))
        },
      })

      mount(kit.host(Contacts, { initialValues: { email: "root@b.co", contacts } }))

      return { rows, form, array }
    }

    it("array insert keeps row values aligned with items", async () => {
      const { form, array } = mountContacts([{ email: "a" }, { email: "b" }])
      await flushPromises()

      const submittedEmails = async () => {
        const handler = await submitWith(form)
        return (handler.mock.calls[0]?.[0] as { contacts: ({ email?: string } | undefined)[] }).contacts.map((row) => row?.email)
      }

      array.insert(1)
      await flushPromises()
      expect(array.items.value).toHaveLength(3)
      expect(await submittedEmails()).toEqual(["a", undefined, "b"])

      array.insert(0)
      await flushPromises()
      expect(array.items.value).toHaveLength(4)
      expect(await submittedEmails()).toEqual([undefined, "a", undefined, "b"])
    })

    it("fields in an array iteration write to values at the indexed path", async () => {
      const { rows, form } = mountContacts([{ email: "" }, { email: "" }])
      await flushPromises()

      expect(rows).toHaveLength(2)

      rows[1]!.setValue("second@b.co")
      await flushPromises()

      expect(rows[1]!.value.value).toBe("second@b.co")
      expect(rows[0]!.value.value).toBe("")

      rows[0]!.setValue("first@b.co")
      await flushPromises()

      expect(rows[1]!.value.value).toBe("second@b.co")

      const handler = await submitWith(form)

      expect(handler).toHaveBeenCalledWith({
        email: "root@b.co",
        contacts: [{ email: "first@b.co" }, { email: "second@b.co" }],
      })
    })

    it("group prefixes child field paths", async () => {
      let street!: FieldHandle
      let form!: FormHandle

      const Street = defineComponent({
        setup() {
          street = adapter.useField(field("street", { fullName: "address.street" }))
          return () => null
        },
      })

      const Address = defineComponent({
        setup() {
          form = adapter.useForm()
          adapter.useGroup({ name: "address" })
          return () => h(Street)
        },
      })

      mount(kit.host(Address, { initialValues: { email: "a@b.co" } }))
      await flushPromises()

      street.setValue("Main St")
      await flushPromises()

      const handler = await submitWith(form)

      expect(handler).toHaveBeenCalledWith({ email: "a@b.co", address: { street: "Main St" } })
    })
  })
}
