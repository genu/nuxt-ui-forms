import { defineNuxtConfig } from "nuxt/config"
import NuxtUiForms from "../../../src/module"

export default defineNuxtConfig({
  compatibilityDate: "2025-12-15",
  modules: [NuxtUiForms],
  ui: {
    prefix: "N",
  },
})
