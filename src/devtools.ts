import { existsSync } from "node:fs"
import type { Resolver } from "@nuxt/kit"
import type { Nuxt } from "@nuxt/schema"
import { NUXT_DEVTOOLS_GROUP_ID, onDevtoolsReady } from "@nuxt/devtools-kit"

export const DEVTOOLS_UI_ROUTE = "/__nuxt-ui-forms"
export const DEVTOOLS_UI_LOCAL_PORT = 3300

export const setupDevToolsUI = (nuxt: Nuxt, resolver: Resolver) => {
  if (!nuxt.options.dev) return

  const clientPath = resolver.resolve("./client")

  if (existsSync(clientPath)) {
    nuxt.hook("vite:serverCreated", async (server, { isClient }) => {
      if (!isClient) return
      const { default: sirv } = await import("sirv")
      server.middlewares.use(DEVTOOLS_UI_ROUTE, sirv(clientPath, { dev: true, single: true }))
    })
  } else {
    nuxt.hook("vite:extend", ({ config }) => {
      config.server ??= {}
      config.server.proxy ??= {}
      config.server.proxy[DEVTOOLS_UI_ROUTE] = {
        target: `http://localhost:${DEVTOOLS_UI_LOCAL_PORT}${DEVTOOLS_UI_ROUTE}`,
        changeOrigin: true,
        followRedirects: true,
        rewrite: (path) => path.replace(DEVTOOLS_UI_ROUTE, ""),
      }
    })
  }

  onDevtoolsReady((ctx) => {
    ctx.docks.register({
      id: "nuxt-ui-forms",
      title: "Forms",
      icon: "carbon:data-table",
      type: "iframe",
      url: DEVTOOLS_UI_ROUTE,
      groupId: NUXT_DEVTOOLS_GROUP_ID,
      category: "modules",
    })
  }, nuxt)
}
