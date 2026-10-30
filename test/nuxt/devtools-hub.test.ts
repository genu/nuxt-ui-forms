import { afterEach, describe, expect, it, vi } from "vitest"
import { defineComponent, h, type Component } from "vue"
import type { VueWrapper } from "@vue/test-utils"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import { useNuxtApp } from "#app"
import { adapter } from "#nuxt-ui-forms/adapter"
import BasicForm from "#fixture/components/BasicForm.vue"
import FileForm from "#fixture/components/FileForm.vue"
import type { FormsHub } from "../../src/runtime/devtools/hub"
import type { FormSnapshot } from "../../src/runtime/devtools/snapshot"
import { adapterName, interact, settle } from "./helpers"

const hub = () => useNuxtApp().$formsDevtools as FormsHub

const mounted: VueWrapper[] = []

const mount = async (component: Component, props: Record<string, unknown> = {}) => {
  const wrapper = await mountSuspended(component, { props })
  mounted.push(wrapper)
  await settle()
  return wrapper
}

const ids = () =>
  hub()
    .list()
    .map(({ id }) => id)

const fieldOf = (snapshots: FormSnapshot[], formId: string, path: string) =>
  snapshots.find(({ id }) => id === formId)?.fields.find((field) => field.path === path)

const recordOnNotify = <T>(read: (snapshots: FormSnapshot[]) => T) => {
  const records: T[] = []
  const unsubscribe = hub().subscribe(() => records.push(read(hub().list())))
  return { records, unsubscribe }
}

const Toggle = defineComponent({
  props: { show: Boolean },
  setup: (props) => () => (props.show ? h(BasicForm, { id: "toggled" }) : h("p", "hidden")),
})

const Twins = defineComponent({
  setup: () => () => h("div", [h(BasicForm, { id: "twin" }), h(BasicForm, { id: "twin" })]),
})

const spyOnFormSnapshot = () => {
  const snapshot = vi.fn()
  const useForm = adapter.useForm
  vi.spyOn(adapter, "useForm").mockImplementation((options) => {
    const handle = useForm(options)
    snapshot.mockImplementation(handle.snapshot!)
    return { ...handle, snapshot }
  })
  return snapshot
}

describe("forms devtools hub", () => {
  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount())
    vi.restoreAllMocks()
  })

  it("lists a mounted UForm with its fields", async () => {
    await mount(BasicForm, { id: "profile", showNickname: true })

    const snapshot = hub()
      .list()
      .find(({ id }) => id === "profile")
    expect(snapshot).toMatchObject({ adapter: adapterName, state: { submitAttempted: false } })
    expect(snapshot!.fields.map(({ path }) => path)).toEqual(["email", "nickname"])
  })

  it("notifies subscribers after a blur, with the field marked blurred", async () => {
    const wrapper = await mount(BasicForm, { id: "profile" })
    const { records, unsubscribe } = recordOnNotify((snapshots) => fieldOf(snapshots, "profile", "email")?.blurred)

    await wrapper.get('[data-testid="email-input"]').trigger("blur")

    await vi.waitFor(() => expect(records).toContain(true))
    unsubscribe()
  })

  it("notifies subscribers after typing, with the field dirty and holding the value", async () => {
    const wrapper = await mount(BasicForm, { id: "profile" })
    const { records, unsubscribe } = recordOnNotify((snapshots) => fieldOf(snapshots, "profile", "email"))

    await interact(wrapper, "email-input", "a@b.co")

    await vi.waitFor(() => expect(records).toContainEqual(expect.objectContaining({ dirty: true, value: "a@b.co" })))
    unsubscribe()
  })

  it("removes the form when it unmounts", async () => {
    await mount(BasicForm, { id: "profile" })
    expect(ids()).toEqual(["profile"])

    mounted.pop()!.unmount()

    expect(ids()).toEqual([])
  })

  it("lists a form toggled with v-if exactly once, under its own id", async () => {
    const wrapper = await mount(Toggle, { show: true })

    await wrapper.setProps({ show: false })
    await wrapper.setProps({ show: true })
    await wrapper.setProps({ show: false })
    await wrapper.setProps({ show: true })
    await settle()

    expect(ids()).toEqual(["toggled"])
  })

  it("gives two forms with the same id distinct ids", async () => {
    await mount(Twins)

    expect(ids()).toEqual(["twin", "twin-2"])
  })

  it("lists a form holding a File value without throwing", async () => {
    await mount(FileForm)

    expect(fieldOf(hub().list(), "upload", "avatar")?.value).toEqual({
      $type: "File",
      name: "avatar.png",
      size: 6,
      type: "image/png",
    })
  })

  it("stays inert without subscribers and resumes once someone subscribes", async () => {
    const snapshot = spyOnFormSnapshot()
    const wrapper = await mount(BasicForm, { id: "profile" })
    snapshot.mockClear()

    await interact(wrapper, "email-input", "a@b.co")
    expect(snapshot).not.toHaveBeenCalled()

    const listener = vi.fn()
    const unsubscribe = hub().subscribe(listener)
    await vi.waitFor(() => expect(listener).toHaveBeenCalled())
    expect(snapshot).toHaveBeenCalled()

    snapshot.mockClear()
    listener.mockClear()
    await interact(wrapper, "email-input", "c@d.co")
    await vi.waitFor(() => expect(listener).toHaveBeenCalled())
    expect(snapshot).toHaveBeenCalled()
    unsubscribe()
  })
})
