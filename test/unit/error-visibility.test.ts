import { describe, expect, it } from "vitest"
import { isErrorVisible } from "../../src/runtime/core/error-visibility"
import type { ValidateOn } from "../../src/runtime/core/types"

const gates: ValidateOn[] = ["blur", "touched", "dirty"]
const idle = { submitAttempted: false, touched: false, blurred: false, dirty: false }

describe("isErrorVisible", () => {
  it.each(gates)("is always visible after a submit attempt (validateOn=%s)", (validateOn) => {
    expect(isErrorVisible({ ...idle, validateOn, submitAttempted: true })).toBe(true)
  })

  it.each(gates)("is hidden when nothing has happened (validateOn=%s)", (validateOn) => {
    expect(isErrorVisible({ ...idle, validateOn })).toBe(false)
  })

  it("gates blur on blurred only", () => {
    expect(isErrorVisible({ ...idle, validateOn: "blur", blurred: true })).toBe(true)
    expect(isErrorVisible({ ...idle, validateOn: "blur", touched: true, dirty: true })).toBe(false)
  })

  it("gates touched on touched only", () => {
    expect(isErrorVisible({ ...idle, validateOn: "touched", touched: true })).toBe(true)
    expect(isErrorVisible({ ...idle, validateOn: "touched", blurred: true, dirty: true })).toBe(false)
  })

  it("gates dirty on dirty only", () => {
    expect(isErrorVisible({ ...idle, validateOn: "dirty", dirty: true })).toBe(true)
    expect(isErrorVisible({ ...idle, validateOn: "dirty", blurred: true, touched: true })).toBe(false)
  })
})
