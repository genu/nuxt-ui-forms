import { describe, expect, it } from "vitest"
import { resolveAdapter } from "../../src/adapters"

describe("resolveAdapter", () => {
  it("resolves the formwerk adapter", () => {
    const adapter = resolveAdapter("formwerk")

    expect(adapter.name).toBe("formwerk")
    expect(adapter.peer).toBe("@formwerk/core")
  })

  it("throws for an unknown adapter", () => {
    expect(() => resolveAdapter("nope")).toThrow(/Unknown form adapter "nope"/)
  })
})
