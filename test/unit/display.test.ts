import { describe, expect, it } from "vitest"
import { fieldErrors } from "../../client/utils/display"
import type { FieldSnapshot } from "../../src/runtime/devtools/snapshot"

const field = (path: string, error?: string): FieldSnapshot => ({
  path,
  value: "",
  ...(error === undefined ? {} : { error }),
  touched: false,
  blurred: false,
  dirty: false,
})

describe("fieldErrors", () => {
  it("returns nothing for a field without errors", () => {
    expect(fieldErrors(field("email"), { name: ["Required"] })).toEqual([])
  })

  it("returns the field's own error", () => {
    expect(fieldErrors(field("email", "Invalid email"), {})).toEqual(["Invalid email"])
  })

  it("adds the form-level messages for the field's path without duplicates", () => {
    expect(fieldErrors(field("email", "Invalid email"), { email: ["Invalid email", "Too short"] })).toEqual([
      "Invalid email",
      "Too short",
    ])
  })

  it("uses form-level messages when the field reports none", () => {
    expect(fieldErrors(field("contacts.0.name"), { "contacts.0.name": ["Required"] })).toEqual(["Required"])
  })
})
