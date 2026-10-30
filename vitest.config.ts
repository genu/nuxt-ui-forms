import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"
import { defineVitestProject } from "@nuxt/test-utils/config"

const fixtureDir = (fixture: string) => fileURLToPath(new URL(`./test/fixtures/${fixture}`, import.meta.url))

const nuxtProject = (fixture: string) =>
  defineVitestProject({
    test: {
      name: fixture === "basic" ? "nuxt" : `nuxt-${fixture}`,
      include: ["test/nuxt/**/*.test.ts"],
      exclude: fixture === "formisch" ? [] : ["test/nuxt/formisch.test.ts"],
      alias: { "#fixture": fixtureDir(fixture) },
      environmentOptions: {
        nuxt: {
          rootDir: fixtureDir(fixture),
          domEnvironment: "happy-dom",
          overrides: {
            plugins: [{ src: fileURLToPath(new URL("./src/runtime/devtools/plugin", import.meta.url)), mode: "client" }],
          },
        },
      },
    },
  })

export default defineConfig({
  test: {
    onConsoleLog: (log) => !log.includes("<Suspense> is an experimental feature"),
    projects: [
      {
        test: {
          name: "unit",
          environment: "happy-dom",
          include: ["test/unit/**/*.test.ts"],
        },
      },
      ...(await Promise.all(["basic", "formisch"].map(nuxtProject))),
      {
        test: {
          name: "e2e",
          environment: "node",
          include: ["test/e2e/**/*.test.ts"],
        },
      },
    ],
  },
})
