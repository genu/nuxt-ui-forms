import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { computed } from "vue"
import { createFormsHub } from "../../src/runtime/devtools/hub"
import type { FormSnapshot } from "../../src/runtime/devtools/snapshot"

const snapshot = (id: string, values: unknown = {}): FormSnapshot => ({
  id,
  adapter: "test",
  state: { submitAttempted: false },
  values,
  errors: {},
  fields: [],
})

describe("createFormsHub", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("lists registered forms and drops them once unregistered", () => {
    const hub = createFormsHub()
    const unregisterA = hub.register("a", () => snapshot("a"))
    hub.register("b", () => snapshot("b"))

    expect(hub.list().map(({ id }) => id)).toEqual(["a", "b"])
    expect(hub.has("a")).toBe(true)

    unregisterA()

    expect(hub.list().map(({ id }) => id)).toEqual(["b"])
    expect(hub.has("a")).toBe(false)
  })

  it("calls every reader fresh on each list()", () => {
    const hub = createFormsHub()
    let count = 0
    hub.register("a", () => snapshot("a", { count: ++count }))

    expect(hub.list()[0]!.values).toEqual({ count: 1 })
    expect(hub.list()[0]!.values).toEqual({ count: 2 })
  })

  it("registering an existing id replaces it, and the stale unregister leaves the replacement alone", () => {
    const hub = createFormsHub()
    const unregisterFirst = hub.register("a", () => snapshot("a", "first"))
    hub.register("a", () => snapshot("a", "second"))

    expect(hub.list()).toEqual([snapshot("a", "second")])

    unregisterFirst()

    expect(hub.list()).toEqual([snapshot("a", "second")])
  })

  it("skips a reader that throws instead of throwing", () => {
    const hub = createFormsHub()
    hub.register("broken", () => {
      throw new Error("boom")
    })
    hub.register("ok", () => snapshot("ok"))

    expect(() => hub.list()).not.toThrow()
    expect(hub.list().map(({ id }) => id)).toEqual(["ok"])
  })

  it("calls subscribers once per throttle window, on the trailing edge", () => {
    const hub = createFormsHub({ throttleMs: 100 })
    const listener = vi.fn()
    hub.subscribe(listener)

    hub.notify()
    hub.notify()
    vi.advanceTimersByTime(60)
    hub.notify()
    expect(listener).not.toHaveBeenCalled()

    vi.advanceTimersByTime(40)
    expect(listener).toHaveBeenCalledOnce()

    hub.notify()
    vi.advanceTimersByTime(99)
    expect(listener).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(1)
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it("throttles to 50 ms by default", () => {
    const hub = createFormsHub()
    const listener = vi.fn()
    hub.subscribe(listener)

    hub.notify()
    vi.advanceTimersByTime(49)
    expect(listener).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(listener).toHaveBeenCalledOnce()
  })

  it("notifies on register and on unregister", () => {
    const hub = createFormsHub()
    const listener = vi.fn()
    hub.subscribe(listener)

    const unregister = hub.register("a", () => snapshot("a"))
    vi.runAllTimers()
    expect(listener).toHaveBeenCalledOnce()

    unregister()
    vi.runAllTimers()
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it("stops calling a subscriber after it unsubscribes", () => {
    const hub = createFormsHub()
    const kept = vi.fn()
    const dropped = vi.fn()
    hub.subscribe(kept)
    const unsubscribe = hub.subscribe(dropped)

    unsubscribe()
    hub.notify()
    vi.runAllTimers()

    expect(kept).toHaveBeenCalledOnce()
    expect(dropped).not.toHaveBeenCalled()
  })

  it("keeps calling the other subscribers when one throws", () => {
    const hub = createFormsHub()
    const listener = vi.fn()
    hub.subscribe(() => {
      throw new Error("detached iframe")
    })
    hub.subscribe(listener)

    hub.notify()

    expect(() => vi.runAllTimers()).not.toThrow()
    expect(listener).toHaveBeenCalledOnce()
  })

  it("exposes a reactive subscriber count", () => {
    const hub = createFormsHub()
    const watched = computed(() => hub.subscriberCount.value)
    expect(watched.value).toBe(0)

    const unsubscribeA = hub.subscribe(() => {})
    const unsubscribeB = hub.subscribe(() => {})
    expect(watched.value).toBe(2)

    unsubscribeA()
    unsubscribeA()
    expect(watched.value).toBe(1)

    unsubscribeB()
    expect(watched.value).toBe(0)
  })
})
