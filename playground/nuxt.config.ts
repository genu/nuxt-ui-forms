const adapter = process.env.NUXT_UI_FORMS_ADAPTER === "formisch" ? "formisch" : "formwerk"

export default defineNuxtConfig({
  compatibilityDate: "2025-12-15",
  modules: ["../src/module"],
  css: ["~/assets/css/main.css"],
  devtools: { enabled: true },
  forms: { adapter },
  runtimeConfig: {
    public: { formsAdapter: adapter },
  },
})
