import { describe, expect, it } from "vitest"
import { ref } from "vue"
import type { FieldHandle, FormLevelSnapshot } from "../../src/runtime/core/types"
import { buildFormSnapshot, toJsonSafe } from "../../src/runtime/devtools/snapshot"

const createHandle = (
  value: unknown,
  {
    error,
    touched = false,
    blurred = false,
    dirty = false,
  }: Partial<{ error: string; touched: boolean; blurred: boolean; dirty: boolean }> = {},
): FieldHandle => ({
  value: ref(value),
  setValue: () => {},
  error: ref(error),
  touched: ref(touched),
  blurred: ref(blurred),
  dirty: ref(dirty),
  handleEvent: () => {},
})

const holes = (count: number) => Array.from({ length: count }, () => "[undefined]")

const nest = (depth: number): Record<string, unknown> => (depth === 0 ? { leaf: true } : { a: nest(depth - 1) })

describe("toJsonSafe", () => {
  it("keeps JSON primitives and copies plain containers", () => {
    const input = { s: "x", n: 1, b: false, z: null, list: [1, "two", { three: 3 }] }
    const output = toJsonSafe(input)

    expect(output).toEqual(input)
    expect(output).not.toBe(input)
    expect((output as typeof input).list).not.toBe(input.list)
  })

  it("converts dates to ISO strings", () => {
    expect(toJsonSafe({ at: new Date("2026-01-02T03:04:05.000Z") })).toEqual({ at: "2026-01-02T03:04:05.000Z" })
    expect(toJsonSafe(new Date(Number.NaN))).toBe("Invalid Date")
  })

  it("describes files and blobs", () => {
    const file = new File(["hello"], "hello.txt", { type: "text/plain" })
    const blob = new Blob(["abc"], { type: "application/octet-stream" })

    expect(toJsonSafe({ file, blob })).toEqual({
      file: { $type: "File", name: "hello.txt", size: 5, type: "text/plain" },
      blob: { $type: "Blob", size: 3, type: "application/octet-stream" },
    })
  })

  it("replaces functions, symbols, undefined and bigints with placeholders", () => {
    expect(toJsonSafe({ fn: () => 1, sym: Symbol("s"), missing: undefined, big: 10n })).toEqual({
      fn: "[Function]",
      sym: "[Symbol]",
      missing: "[undefined]",
      big: "10n",
    })
    const sparse: unknown[] = [undefined]
    sparse[2] = 1
    expect(toJsonSafe(sparse)).toEqual(["[undefined]", "[undefined]", 1])
    expect(toJsonSafe(undefined)).toBe("[undefined]")
  })

  it("marks circular references and keeps repeated non-circular ones", () => {
    const shared = { id: 1 }
    const circular: Record<string, unknown> = { name: "root", left: shared, right: shared }
    circular.self = circular
    circular.list = [circular, shared]

    expect(toJsonSafe(circular)).toEqual({
      name: "root",
      left: { id: 1 },
      right: { id: 1 },
      self: "[Circular]",
      list: ["[Circular]", { id: 1 }],
    })
  })

  it("truncates beyond depth 8", () => {
    let node = toJsonSafe(nest(12)) as Record<string, unknown>
    for (let depth = 0; depth < 7; depth++) node = node.a as Record<string, unknown>

    expect(node.a).toBe("[Truncated]")
    expect(toJsonSafe(nest(7))).toEqual(nest(7))
  })

  it("never throws on hostile input and leaves the input untouched", () => {
    const hostile = {
      ok: 1,
      get boom() {
        throw new Error("nope")
      },
    }
    const frozen = Object.freeze({ nested: Object.freeze({ value: new Date(0) }) })

    expect(toJsonSafe(hostile)).toEqual({ ok: 1, boom: "[Unreadable]" })
    expect(toJsonSafe(frozen)).toEqual({ nested: { value: "1970-01-01T00:00:00.000Z" } })
    expect(frozen.nested.value).toBeInstanceOf(Date)
  })
})

describe("buildFormSnapshot", () => {
  const fields = () =>
    new Map<string, FieldHandle>([
      ["name", createHandle("Neo", { touched: true, dirty: true })],
      ["contacts.10.email", createHandle("k@b.co")],
      ["email", createHandle("", { error: "Required", blurred: true })],
      ["contacts.2.email", createHandle("c@b.co")],
      ["address.street", createHandle(new Date("2026-01-01T00:00:00.000Z"))],
    ])

  it("sorts fields by path and passes values through toJsonSafe", () => {
    const snapshot = buildFormSnapshot({ id: "f1", adapter: "test", submitAttempted: false, fields: fields() })

    expect(snapshot.fields.map((f) => f.path)).toEqual(["address.street", "contacts.2.email", "contacts.10.email", "email", "name"])
    expect(snapshot.fields[0]).toEqual({
      path: "address.street",
      value: "2026-01-01T00:00:00.000Z",
      touched: false,
      blurred: false,
      dirty: false,
    })
    expect(snapshot.fields.find((f) => f.path === "email")).toEqual({
      path: "email",
      value: "",
      error: "Required",
      touched: false,
      blurred: true,
      dirty: false,
    })
  })

  it("derives values and errors from the fields without a form-level hook", () => {
    const snapshot = buildFormSnapshot({ id: "f1", adapter: "test", submitAttempted: true, fields: fields() })

    expect(snapshot.id).toBe("f1")
    expect(snapshot.adapter).toBe("test")
    expect(snapshot.state).toEqual({ submitAttempted: true })
    expect(snapshot.values).toEqual({
      address: { street: "2026-01-01T00:00:00.000Z" },
      contacts: [...holes(2), { email: "c@b.co" }, ...holes(7), { email: "k@b.co" }],
      email: "",
      name: "Neo",
    })
    expect(snapshot.errors).toEqual({ email: ["Required"] })
  })

  it("nests overlapping paths without touching field values", () => {
    const address = { city: "Zion" }
    const snapshot = buildFormSnapshot({
      id: "f1",
      adapter: "test",
      submitAttempted: false,
      fields: new Map([
        ["address", createHandle(address)],
        ["address.street", createHandle("Main St")],
      ]),
    })

    expect(snapshot.values).toEqual({ address: { city: "Zion", street: "Main St" } })
    expect(snapshot.fields[0]!.value).toEqual({ city: "Zion" })
    expect(address).toEqual({ city: "Zion" })
  })

  it("uses the form-level hook for values, errors and state when given", () => {
    const form: FormLevelSnapshot = {
      values: { email: "", extra: () => 1 },
      errors: { email: ["Required", "Too short"], "contacts.0.email": ["Invalid"] },
      valid: false,
      dirty: true,
      submitting: false,
    }

    const snapshot = buildFormSnapshot({ id: "f1", adapter: "test", submitAttempted: false, form, fields: fields() })

    expect(snapshot.state).toEqual({ valid: false, dirty: true, submitting: false, submitAttempted: false })
    expect(snapshot.values).toEqual({ email: "", extra: "[Function]" })
    expect(snapshot.errors).toEqual({ email: ["Required", "Too short"], "contacts.0.email": ["Invalid"] })
    expect(snapshot.fields).toHaveLength(5)
  })

  it("returns plain JSON", () => {
    const snapshot = buildFormSnapshot({ id: "f1", adapter: "test", submitAttempted: false, fields: fields() })

    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot)
  })
})
