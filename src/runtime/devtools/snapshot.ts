import type { FieldHandle, FormLevelSnapshot } from "../core/types"

export interface FieldSnapshot {
  path: string
  value: unknown
  error?: string
  touched: boolean
  blurred: boolean
  dirty: boolean
}

export interface FormSnapshot {
  id: string
  adapter: string
  state: { valid?: boolean; dirty?: boolean; submitting?: boolean; submitAttempted: boolean }
  values: unknown
  errors: Record<string, string[]>
  fields: FieldSnapshot[]
}

export interface BuildFormSnapshotInput {
  id: string
  adapter: string
  submitAttempted: boolean
  form?: FormLevelSnapshot
  fields: ReadonlyMap<string, FieldHandle>
}

const MAX_DEPTH = 8

const isFile = (value: object): value is File => typeof File !== "undefined" && value instanceof File
const isBlob = (value: object): value is Blob => typeof Blob !== "undefined" && value instanceof Blob

const describeDate = (date: Date) => (Number.isNaN(date.getTime()) ? "Invalid Date" : date.toISOString())

const describeBlob = (blob: Blob) =>
  isFile(blob)
    ? { $type: "File", name: blob.name, size: blob.size, type: blob.type }
    : { $type: "Blob", size: blob.size, type: blob.type }

const convertChild = (parent: object, key: string | number, ancestors: WeakSet<object>, depth: number): unknown => {
  try {
    return convert((parent as Record<string | number, unknown>)[key], ancestors, depth)
  } catch {
    return "[Unreadable]"
  }
}

const convert = (value: unknown, ancestors: WeakSet<object>, depth: number): unknown => {
  if (value === undefined) return "[undefined]"
  if (value === null || typeof value === "string" || typeof value === "boolean") return value
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value)
  if (typeof value === "bigint") return `${value}n`
  if (typeof value === "function") return "[Function]"
  if (typeof value === "symbol") return "[Symbol]"

  const object = value as object
  if (object instanceof Date) return describeDate(object)
  if (isBlob(object)) return describeBlob(object)
  if (ancestors.has(object)) return "[Circular]"
  if (depth >= MAX_DEPTH) return "[Truncated]"

  ancestors.add(object)
  try {
    if (Array.isArray(object)) {
      return Array.from({ length: object.length }, (_, index) => convertChild(object, index, ancestors, depth + 1))
    }
    return Object.fromEntries(Object.keys(object).map((key) => [key, convertChild(object, key, ancestors, depth + 1)]))
  } finally {
    ancestors.delete(object)
  }
}

export const toJsonSafe = (value: unknown): unknown => convertChild({ value }, "value", new WeakSet(), 0)

const isIndex = (segment: string) => /^\d+$/.test(segment)

const isContainer = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null

const assemble = (entries: [string, unknown][]) => {
  const root: Record<string, unknown> = Object.create(null)
  for (const [path, value] of entries) {
    const segments = path.split(".")
    const last = segments.pop()!
    let node = root
    segments.forEach((segment, index) => {
      if (!Object.hasOwn(node, segment) || !isContainer(node[segment])) {
        node[segment] = isIndex(segments[index + 1] ?? last) ? [] : Object.create(null)
      }
      node = node[segment] as Record<string, unknown>
    })
    node[last] = toJsonSafe(value)
  }
  return root
}

const comparePaths = (a: string, b: string) => a.localeCompare(b, "en", { numeric: true })

export const buildFormSnapshot = ({ id, adapter, submitAttempted, form, fields }: BuildFormSnapshotInput): FormSnapshot => {
  const entries = [...fields].sort(([a], [b]) => comparePaths(a, b))

  const fieldSnapshots = entries.map<FieldSnapshot>(([path, handle]) => ({
    path,
    value: toJsonSafe(handle.value.value),
    ...(handle.error.value === undefined ? {} : { error: handle.error.value }),
    touched: handle.touched.value,
    blurred: handle.blurred.value,
    dirty: handle.dirty.value,
  }))

  const fieldErrors = Object.fromEntries(
    fieldSnapshots.flatMap(({ path, error }): [string, string[]][] => (error === undefined ? [] : [[path, [error]]])),
  )

  return {
    id,
    adapter,
    state: {
      ...(form && { valid: form.valid, dirty: form.dirty, submitting: form.submitting }),
      submitAttempted,
    },
    values: toJsonSafe(form ? form.values : assemble(entries.map(([path, handle]) => [path, handle.value.value]))),
    errors: form ? (toJsonSafe(form.errors) as Record<string, string[]>) : fieldErrors,
    fields: fieldSnapshots,
  }
}
