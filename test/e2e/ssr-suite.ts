import { fileURLToPath } from "node:url"
import { describe, it, expect } from "vitest"
import { setup, $fetch } from "@nuxt/test-utils/e2e"

export const ssrSuite = (fixture: string) =>
  describe(`ssr - ${fixture}`, async () => {
    await setup({
      rootDir: fileURLToPath(new URL(`../fixtures/${fixture}`, import.meta.url)),
    })

    it("renders the index page", async () => {
      const html = await $fetch<string>("/")
      expect(html).toContain('data-testid="basic"')
    })

    it("renders UForm as a <form> without infinite recursion", async () => {
      const html = await $fetch<string>("/")
      expect(html).toMatch(/<form[^>]*data-testid="form"/)
    })

    it("renders UFormField without infinite recursion", async () => {
      const html = await $fetch<string>("/")
      expect(html).toContain('data-testid="form-field"')
    })

    it("makes original Nuxt UI FormField accessible as NuxtUiFormField", async () => {
      const html = await $fetch<string>("/")
      expect(html).toContain('data-testid="nuxtui-form-field"')
    })

    it("renders form field with label", async () => {
      const html = await $fetch<string>("/")
      expect(html).toMatch(/<label[^>]*data-slot="label"[^>]*>(?:<!--\[-->)*Email/)
    })

    it("renders input inside form field", async () => {
      const html = await $fetch<string>("/")
      expect(html).toContain('data-testid="email-input"')
    })

    it("renders required form field", async () => {
      const html = await $fetch<string>("/")
      expect(html).toContain('data-testid="form-field-required"')
      expect(html).toMatch(/<label[^>]*data-slot="label"[^>]*>(?:<!--\[-->)*Username/)
    })

    it("renders a field's initial value from the form library", async () => {
      const html = await $fetch<string>("/")
      expect(html).toContain('value="initial@example.com"')
    })
  })
