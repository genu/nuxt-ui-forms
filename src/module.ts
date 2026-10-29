import { defineNuxtModule, addComponent, addPlugin, createResolver } from "@nuxt/kit"
import { resolveAdapter } from "./adapters"
import { setupDevToolsUI } from "./devtools"

export type * from "./runtime/types"

export interface ModuleOptions {
  adapter: "formwerk"
  devtools: boolean
}

const isResolvable = (id: string) => {
  try {
    import.meta.resolve(id)
    return true
  } catch {
    return false
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "nuxt-ui-forms",
    configKey: "forms",
  },
  defaults: {
    adapter: "formwerk",
    devtools: true,
  },
  moduleDependencies: {
    "@nuxt/ui": {},
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    const adapter = resolveAdapter(options.adapter)

    if (!isResolvable(adapter.peer)) {
      throw new Error(
        `[nuxt-ui-forms] The "${adapter.name}" adapter requires "${adapter.peer}". Install it with: pnpm add ${adapter.peer}`,
      )
    }

    adapter.setup?.(nuxt)

    const adapterEntry = resolver.resolve(adapter.runtimeEntry)
    nuxt.options.alias["#nuxt-ui-forms/adapter"] = adapterEntry
    nuxt.hook("prepare:types", ({ tsConfig }) => {
      tsConfig.compilerOptions ??= {}
      tsConfig.compilerOptions.paths ??= {}
      tsConfig.compilerOptions.paths["#nuxt-ui-forms/adapter"] = [adapterEntry]
    })

    const uiOptions = nuxt.options.ui as { prefix?: string } | undefined
    const prefix = uiOptions?.prefix ?? "U"

    // Rename Nuxt UI's Form and FormField to NuxtUi* so we can override them
    const componentsToRename = [`${prefix}Form`, `${prefix}FormField`]

    nuxt.hook("components:extend", (components) => {
      for (const name of componentsToRename) {
        const component = components.find((c) => c.pascalName === name && c.filePath?.includes("@nuxt/ui"))
        if (component) {
          component.pascalName = `NuxtUi${name.slice(prefix.length)}`
          component.kebabName = `nuxt-ui-${name
            .slice(prefix.length)
            .replaceAll(/([a-z])([A-Z])/g, "$1-$2")
            .toLowerCase()}`
        }
      }
    })

    const components = {
      Form: "Form",
      FormField: "Field",
      FormGroup: "Group",
      FormRepeater: "Repeater",
    }

    for (const [name, file] of Object.entries(components)) {
      addComponent({
        name: `${prefix}${name}`,
        filePath: resolver.resolve(`./runtime/components/${file}.vue`),
      })
    }

    if (options.devtools && nuxt.options.dev) {
      addPlugin({ src: resolver.resolve("./runtime/devtools/plugin"), mode: "client" })
      setupDevToolsUI(nuxt, resolver)
    }
  },
})
