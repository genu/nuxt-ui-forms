import { afterEach, describe, expect, it, vi } from "vitest"
import { copyText } from "../../client/utils/clipboard"

const stubClipboard = (writeText?: (text: string) => Promise<void>) =>
  Object.defineProperty(navigator, "clipboard", { value: writeText && { writeText }, configurable: true })

const stubExecCommand = (result: boolean) => {
  const copied: string[] = []
  const execCommand = vi.fn((command: string) => {
    if (command === "copy") copied.push(document.querySelector("textarea")!.value)
    return result
  })
  Object.defineProperty(document, "execCommand", { value: execCommand, configurable: true })
  return { execCommand, copied }
}

describe("copyText", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    stubClipboard()
  })

  it("uses the async clipboard when it works", async () => {
    const writeText = vi.fn(() => Promise.resolve())
    stubClipboard(writeText)
    const { execCommand } = stubExecCommand(true)

    expect(await copyText('{ "a": 1 }')).toBe("clipboard")
    expect(writeText).toHaveBeenCalledWith('{ "a": 1 }')
    expect(execCommand).not.toHaveBeenCalled()
  })

  it("falls back to a hidden textarea when the clipboard rejects", async () => {
    stubClipboard(() => Promise.reject(new DOMException("denied", "NotAllowedError")))
    const { copied } = stubExecCommand(true)
    const button = document.body.appendChild(document.createElement("button"))
    button.focus()

    expect(await copyText("text")).toBe("fallback")
    expect(copied).toEqual(["text"])
    expect(document.querySelector("textarea")).toBeNull()
    expect(document.activeElement).toBe(button)
    button.remove()
  })

  it("falls back when there is no async clipboard", async () => {
    stubClipboard()
    const { copied } = stubExecCommand(true)

    expect(await copyText("text")).toBe("fallback")
    expect(copied).toEqual(["text"])
  })

  it("reports failure when both paths fail", async () => {
    stubClipboard(() => Promise.reject(new Error("denied")))
    stubExecCommand(false)

    expect(await copyText("text")).toBe(false)
    expect(document.querySelector("textarea")).toBeNull()
  })
})
