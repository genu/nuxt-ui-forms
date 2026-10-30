import { describe, expect, it } from "vitest"
import { toPath } from "../../src/runtime/adapters/formisch/path"

describe("toPath", () => {
  it("splits a single segment", () => {
    expect(toPath("email")).toEqual(["email"])
  })

  it("turns digit-only segments into numbers", () => {
    expect(toPath("user.contacts.0.email")).toEqual(["user", "contacts", 0, "email"])
  })

  it("returns an empty path for an empty name", () => {
    expect(toPath("")).toEqual([])
  })
})
