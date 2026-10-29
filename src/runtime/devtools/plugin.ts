import { defineNuxtPlugin } from "#app"
import { createFormsHub } from "./hub"

export default defineNuxtPlugin({
  name: "nuxt-ui-forms:devtools",
  setup: () => ({ provide: { formsDevtools: createFormsHub() } }),
})
