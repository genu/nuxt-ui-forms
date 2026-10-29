import { spawnSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const clientEntry = join(root, "dist/client/index.html")
const output = join(root, "playground/.output")
const forbidden = [
  "formsDevtools",
  "createFormsHub",
  "__nuxt-ui-forms",
  "use-form-devtools",
  "nuxt-ui-forms:devtools",
  "buildFormSnapshot",
  "toJsonSafe",
]

const fail = (message) => {
  console.error(`check:prod failed: ${message}`)
  process.exit(1)
}

if (!existsSync(clientEntry)) fail(`${clientEntry} is missing, run pnpm prepack first`)

const build = spawnSync("pnpm", ["exec", "nuxi", "build", "playground"], { cwd: root, stdio: "inherit" })
if (build.status !== 0) fail("production build of the playground failed")

const leaks = readdirSync(output, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => join(entry.parentPath, entry.name))
  .flatMap((file) => {
    const content = readFileSync(file, "latin1")
    return forbidden.filter((needle) => content.includes(needle)).map((needle) => `${file}: ${needle}`)
  })

if (leaks.length) fail(`devtools code in the production build:\n${leaks.join("\n")}`)

console.log(`check:prod passed: ${clientEntry} exists and no devtools code in ${output}`)
