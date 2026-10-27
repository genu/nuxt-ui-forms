import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "happy-dom",
          include: ["test/unit/**/*.test.ts"],
        },
      },
    ],
  },
})
