import { describe, expect, it } from "vitest"
import { missingPeersError, resolveAdapter } from "../../src/adapters"

describe("resolveAdapter", () => {
  it("resolves the formwerk adapter", () => {
    const adapter = resolveAdapter("formwerk")

    expect(adapter.name).toBe("formwerk")
    expect(adapter.peers).toEqual(["@formwerk/core"])
  })

  it("resolves the formisch adapter", () => {
    const adapter = resolveAdapter("formisch")

    expect(adapter.name).toBe("formisch")
    expect(adapter.peers).toEqual(["@formisch/vue", "valibot"])
    expect(adapter.runtimeEntry).toBe("runtime/adapters/formisch/index")
  })

  it("throws for an unknown adapter", () => {
    expect(() => resolveAdapter("nope")).toThrow('Unknown form adapter "nope". Available adapters: formwerk, formisch')
  })
})

describe("missingPeersError", () => {
  const formisch = resolveAdapter("formisch")

  it("lists every missing peer with one install command", () => {
    expect(missingPeersError(formisch, () => false)).toBe(
      '[nuxt-ui-forms] The "formisch" adapter requires "@formisch/vue", "valibot". Install them with: pnpm add @formisch/vue valibot',
    )
  })

  it("lists only the peers that are missing", () => {
    expect(missingPeersError(formisch, (id) => id !== "valibot")).toBe(
      '[nuxt-ui-forms] The "formisch" adapter requires "valibot". Install it with: pnpm add valibot',
    )
  })

  it("returns undefined when every peer resolves", () => {
    expect(missingPeersError(formisch, () => true)).toBeUndefined()
  })
})
