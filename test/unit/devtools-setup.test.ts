import { mkdirSync, mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { Resolver } from "@nuxt/kit"
import type { Nuxt } from "@nuxt/schema"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { onDevtoolsReady } = vi.hoisted(() => ({ onDevtoolsReady: vi.fn() }))

vi.mock("@nuxt/devtools-kit", () => ({
  NUXT_DEVTOOLS_GROUP_ID: "nuxt-devtools-group",
  onDevtoolsReady,
}))

const { setupDevToolsUI, DEVTOOLS_UI_ROUTE, DEVTOOLS_UI_LOCAL_PORT } = await import("../../src/devtools")

const createNuxt = (dev = true) => {
  const hooks = new Map<string, (...args: any[]) => unknown>()
  const nuxt = {
    options: { dev },
    hook: vi.fn((name: string, fn: (...args: any[]) => unknown) => hooks.set(name, fn)),
  } as unknown as Nuxt
  return { nuxt, hooks }
}

const createResolver = (dir: string) => ({ resolve: (path: string) => join(dir, path) }) as unknown as Resolver

describe("setupDevToolsUI", () => {
  let dir: string

  beforeEach(() => {
    onDevtoolsReady.mockReset()
    dir = mkdtempSync(join(tmpdir(), "nuxt-ui-forms-devtools-"))
  })

  it("registers the Forms dock entry when devtools is ready", () => {
    const { nuxt } = createNuxt()

    setupDevToolsUI(nuxt, createResolver(dir))

    expect(onDevtoolsReady).toHaveBeenCalledOnce()
    const register = vi.fn()
    onDevtoolsReady.mock.calls[0]![0]({ docks: { register } })
    expect(register).toHaveBeenCalledOnce()
    expect(register).toHaveBeenCalledWith({
      id: "nuxt-ui-forms",
      title: "Forms",
      icon: "carbon:data-table",
      type: "iframe",
      url: DEVTOOLS_UI_ROUTE,
      groupId: "nuxt-devtools-group",
      category: "modules",
    })
  })

  it("proxies the route to the client dev server when no built client exists", () => {
    const { nuxt, hooks } = createNuxt()

    setupDevToolsUI(nuxt, createResolver(dir))

    expect(hooks.has("vite:serverCreated")).toBe(false)
    const config: { server?: { proxy?: Record<string, any> } } = {}
    hooks.get("vite:extend")!({ config })
    expect(config.server!.proxy![DEVTOOLS_UI_ROUTE]).toMatchObject({
      target: `http://localhost:${DEVTOOLS_UI_LOCAL_PORT}${DEVTOOLS_UI_ROUTE}`,
    })
  })

  it("serves the built client when it exists", async () => {
    mkdirSync(join(dir, "client"))
    const { nuxt, hooks } = createNuxt()

    setupDevToolsUI(nuxt, createResolver(dir))

    expect(hooks.has("vite:extend")).toBe(false)
    const use = vi.fn()
    await hooks.get("vite:serverCreated")!({ middlewares: { use } }, { isClient: true, isServer: false })
    expect(use).toHaveBeenCalledWith(DEVTOOLS_UI_ROUTE, expect.any(Function))
  })

  it("does nothing outside dev", () => {
    const { nuxt } = createNuxt(false)

    expect(() => setupDevToolsUI(nuxt, createResolver(dir))).not.toThrow()
    expect(onDevtoolsReady).not.toHaveBeenCalled()
    expect(nuxt.hook).not.toHaveBeenCalled()
  })
})
