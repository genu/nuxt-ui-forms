import { fileURLToPath } from "node:url"

export default defineNuxtConfig({
  compatibilityDate: "2025-12-15",
  modules: ["@nuxt/ui"],
  css: ["~/assets/css/main.css"],
  ssr: false,
  devtools: { enabled: false },
  ui: {
    fonts: false,
    colorMode: false,
  },
  app: {
    baseURL: "/__nuxt-ui-forms",
  },
  vite: {
    server: {
      hmr: { clientPort: 3300 },
    },
  },
  nitro: {
    output: {
      publicDir: fileURLToPath(new URL("../dist/client", import.meta.url)),
    },
  },
})
