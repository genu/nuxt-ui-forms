import { describe, expect, it } from "vitest"
import { buildFieldTree } from "../../client/utils/field-tree"
import type { FieldSnapshot } from "../../src/runtime/devtools/snapshot"

const field = (path: string, value: unknown = ""): FieldSnapshot => ({ path, value, touched: false, blurred: false, dirty: false })

describe("buildFieldTree", () => {
  it("nests dot paths under container nodes and keeps the field on leaves", () => {
    const fields = [field("email"), field("contacts.1.name"), field("address.street"), field("contacts.0.name")]

    expect(buildFieldTree(fields)).toEqual([
      {
        key: "address",
        path: "address",
        children: [{ key: "street", path: "address.street", field: fields[2], children: [] }],
      },
      {
        key: "contacts",
        path: "contacts",
        children: [
          { key: "0", path: "contacts.0", children: [{ key: "name", path: "contacts.0.name", field: fields[3], children: [] }] },
          { key: "1", path: "contacts.1", children: [{ key: "name", path: "contacts.1.name", field: fields[1], children: [] }] },
        ],
      },
      { key: "email", path: "email", field: fields[0], children: [] },
    ])
  })

  it("leaves container nodes without a field", () => {
    const [contacts] = buildFieldTree([field("contacts.0.name")])

    expect(contacts).not.toHaveProperty("field")
    expect(contacts!.children[0]).not.toHaveProperty("field")
  })

  it("orders array indexes numerically", () => {
    const tree = buildFieldTree([field("tags.10"), field("tags.2"), field("tags.0")])

    expect(tree[0]!.children.map(({ key }) => key)).toEqual(["0", "2", "10"])
  })

  it("keeps a field that also has nested fields as a node with both", () => {
    const parent = field("a", { b: 1 })
    const child = field("a.b", 1)

    expect(buildFieldTree([child, parent])).toEqual([
      { key: "a", path: "a", field: parent, children: [{ key: "b", path: "a.b", field: child, children: [] }] },
    ])
  })

  it("returns the same order whatever the input order", () => {
    const paths = ["b.1", "a", "b.0", "c.x.y", "b.10"]
    const forward = buildFieldTree(paths.map((path) => field(path)))
    const backward = buildFieldTree([...paths].reverse().map((path) => field(path)))

    expect(backward).toEqual(forward)
  })

  it("does not mutate its input", () => {
    const fields = [field("b"), field("a")]

    buildFieldTree(fields)

    expect(fields.map(({ path }) => path)).toEqual(["b", "a"])
  })

  it("returns an empty tree for no fields", () => {
    expect(buildFieldTree([])).toEqual([])
  })
})
