import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"
import { defineVitestProject } from "@nuxt/test-utils/config"

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
      await defineVitestProject({
        test: {
          name: "nuxt",
          include: ["test/nuxt/**/*.test.ts"],
          environmentOptions: {
            nuxt: {
              rootDir: fileURLToPath(new URL("./test/fixtures/basic", import.meta.url)),
              domEnvironment: "happy-dom",
            },
          },
        },
      }),
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
