# Formisch Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `formisch` adapter (`@formisch/vue` + Valibot) selectable with `forms: { adapter: "formisch" }`, reshaping the adapter contract where Formisch doesn't fit it.

**Architecture:** `UForm` gets a `form` prop that is passed to `FormAdapter.useForm({ form })`. The Formisch adapter provides its store through a private injection key for its own `useField`/`useArray`. Full names become getters, because Formisch rows keep their component instance while their index changes. The contract suite gains a `capabilities` flag for the one real difference (`disabled`). Nuxt component tests run against two fixtures (one per adapter) from the same test files.

**Tech Stack:** Nuxt 4.6, Nuxt UI 4.12, Vue 3.5, `@formisch/vue` 1.1.1, `valibot` 1.5.0, Vitest 4 with `@nuxt/test-utils` 4, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-29-formisch-adapter-design.md`. Read it first. Its "How Formisch differs" table is the source for the library facts. The extracted `@formisch/vue` source used to write it is reproducible with `npm pack @formisch/vue@1.1.1`.

## Global Constraints

- pnpm only. Exact versions for dependencies (`"@formisch/vue": "1.1.1"`, `"valibot": "1.5.0"` in devDependencies). Peers keep ranges (`"@formisch/vue": "^1.1.1"`, `"valibot": "^1.4.1"`, both optional via `peerDependenciesMeta`).
- Alpha: change behaviour freely, no compatibility shims (no overload that keeps `useForm()` without options).
- Vue SFCs: imports and interfaces in a plain `<script lang="ts">` block, logic in `<script setup lang="ts">`. Props/Slots/Emits interfaces first, prop destructuring for defaults.
- Composables are `export const useX = () => { ...; return { ... } }`.
- Few comments; self-explanatory code.
- Keep multi-line non-self-closing template tags on one line (the Prettier/ESLint conflict noted in CLAUDE.md).
- The module never wraps or re-exports Formisch's `useForm`. The adapter never overrides the user's `validate`/`revalidate`.
- Conventional Commits. No `Co-Authored-By` or generated-by lines.
- Error-message prefix stays `nuxt-ui-forms:` (runtime) and `[nuxt-ui-forms]` (module setup), matching existing messages.

## Review Focus

1. **Formisch's default `validate: "submit"`:** no error is shown on blur before the first submit. After a submit attempt the errors show, and typing a valid value clears the error (`revalidate: "input"`). Pinned in Task 4.
2. **A field name missing from the Valibot schema:** Formisch's `getFieldStore` throws a bare `No field store found`. The user should get an `Error` naming `nuxt-ui-forms`, the field's full name and the schema. Pinned in Task 2.
3. **A row field handle read after its row is removed** (devtools snapshot or a pending computed before unmount): the handle must read as `undefined`/`false`, not throw. Pinned in Task 2.
4. **A submit handler that throws:** Formisch catches it into the root errors. `UForm` must leave the loading state, raise no unhandled rejection, and the snapshot must show the message under key `""`. Pinned in Task 2 (adapter) and Task 4 (component).
5. **`<UForm :form>` given something that isn't a Formisch store** (e.g. `form.values`, a plain object): same clear error as a missing prop. Pinned in Task 2.

---

### Task 1: Contract changes, Formwerk kept green

**Files:**

- Modify: `src/runtime/core/types.ts`
- Modify: `src/runtime/components/Form.vue`, `Field.vue`, `Repeater.vue`
- Modify: `src/runtime/adapters/formwerk/index.ts`
- Modify: `test/unit/contract/adapter-contract.ts`, `test/unit/formwerk-adapter.test.ts`

**Interfaces:**

- Produces (in `types.ts`):
  - `export interface UseFormOptions { form?: unknown }`
  - `FormAdapter.useForm(options: UseFormOptions): FormHandle`
  - `FieldOptions.fullName: () => string` and `ArrayOptions.fullName: () => string` (docs: "Absolute path, reactive")
- Produces (in `adapter-contract.ts`): `AdapterKit` gains `formOptions: () => UseFormOptions` (called inside a component set up under `kit.host`, so it may `inject`) and `capabilities: { disabledExcludesData: boolean }`.
- Produces: `UForm` prop `form?: object`.

- [ ] **Step 1: Update the contract harness and add the new case**
  - `field(name, extra)` builds `fullName: () => name`. `mountContacts`'s `Row` uses `fullName: () => \`${arrayPath}.${props.index}.email\``, and `useArray`gets`fullName: () => arrayPath`. The "group prefixes" `Street`gets`fullName: () => "address.street"`.
  - Every `adapter.useForm()` inside the host becomes `adapter.useForm(kit.formOptions())`. The "useForm throws outside a form" case calls `adapter.useForm({})`.
  - Wrap the two disabled cases with `it.runIf(kit.capabilities.disabledExcludesData)`.
  - Add a case: `it("useField without a form never errors", ...)`. Mount a component _not_ wrapped by `kit.host` that calls `adapter.useField(field("email"))` with `console.warn`/`console.error` spied. Call `setValue("x")`, then `handleEvent("blur")`, then `handleEvent("input")`, and `flushPromises()`. Expect `value.value === "x"`, `error.value === undefined`, and both spies not called.

- [ ] **Step 2: Run to verify it fails**

  Run: `pnpm vitest run --project unit test/unit/formwerk-adapter.test.ts`
  Expected: FAIL. Type errors / `formOptions is not a function`, because the kit doesn't provide it yet.

- [ ] **Step 3: Implement**
  - In `types.ts`, apply the interface changes above.
  - In `formwerk-adapter.test.ts`, set `formOptions: () => ({})` and `capabilities: { disabledExcludesData: true }`.
  - In the Formwerk adapter, change `useForm` to `(_options) =>` (it ignores `form`). `useArray` reads `fullName()` once at setup (unchanged behaviour).
  - In `Form.vue`, add `form?: object` to `FormProps` and call `adapter.useForm({ form })`.
  - In `Field.vue`, pass `fullName: () => fullName.value`.
  - In `Repeater.vue`, compute `fullName` as `computed(() => resolveFullName(name, scope))` with `scope = useNameScope()` captured at setup, and pass `fullName: () => fullName.value`.

- [ ] **Step 4: Run the full suite**

  Run: `pnpm test && pnpm test:types`
  Expected: PASS. Only the new contract case is added; every existing nuxt/e2e test still passes on Formwerk.

- [ ] **Step 5: Commit** — `refactor: pass the library form through UForm and make adapter full names reactive`

### Task 2: Formisch runtime adapter

**Files:**

- Create: `src/runtime/adapters/formisch/index.ts` (the `FormAdapter`)
- Create: `src/runtime/adapters/formisch/path.ts` (`toPath`)
- Create: `test/unit/formisch-path.test.ts`, `test/unit/formisch-adapter.test.ts`
- Modify: `package.json` (devDependencies `@formisch/vue` `1.1.1` and `valibot` `1.5.0`; run `pnpm add -D -E @formisch/vue@1.1.1 valibot@1.5.0`)

**Interfaces:**

- Consumes: Task 1's `UseFormOptions`, getter `fullName`, `AdapterKit.formOptions`/`capabilities`.
- Produces: `export const adapter: FormAdapter` with `name: "formisch"`. `export const toPath = (fullName: string): (string | number)[]` (digit-only segments become numbers, empty segments dropped).

- [ ] **Step 1: Write the failing tests**
  - `formisch-path.test.ts`: `toPath("email")` → `["email"]`. `toPath("user.contacts.0.email")` → `["user", "contacts", 0, "email"]`. `toPath("")` → `[]`.
  - `formisch-adapter.test.ts`: run `runAdapterContract("formisch", kit)` with `providesSnapshot: true` and `capabilities: { disabledExcludesData: false }`. The `host` calls Formisch `useForm({ schema, initialInput: opts?.initialValues, validate: "initial" })` and `provide`s the store under a test-local key. `formOptions: () => ({ form: inject(key) })`. The schema (`v.object`) declares every path the contract touches:
    - `email: v.pipe(v.string("Required"), v.minLength(1, "Required"))`
    - `age: v.optional(v.pipe(v.string(), v.toNumber()))`
    - `nickname`, `focus`, `change` and `input`: `v.optional(v.string())`
    - `contacts: v.optional(v.array(v.object({ email: v.optional(v.string()) })))`
    - `user: v.optional(v.object({ contacts: <same array> }))`
    - `address: v.optional(v.object({ street: v.optional(v.string()) }))`

    Optional is required on the contact `email`: Formisch only applies `emptyInput` (`""` for strings) to required fields, and the insert case expects `undefined` rows.

  - Formisch-only cases in the same file, outside the shared suite:
    - `it("useField throws a clear error for a name missing from the schema")`: the `Error` message contains `nuxt-ui-forms`, `"missing.path"` and `schema`.
    - `it("a row handle stays readable after its row is removed")`: mount the contacts host, keep `rows[1]`, `array.remove(1)`, `flushPromises()`. Reading `rows[1].value.value`, `.error.value` and `.touched.value` doesn't throw.
    - `it("useForm rejects a value that is not a Formisch store")`: `useForm({ form: { values: {} } })` throws an `Error` containing `useForm()` and `<UForm :form`.
    - `it("a throwing submit handler resolves and shows the message under the root key")`: with valid input, `await form.submit(() => { throw new Error("boom") })()` resolves, and `form.snapshot!().errors[""]` equals `["boom"]`.
    - `it("min/max guard add, insert and remove with a warning")`: with `useArray({ ..., min: 2, max: 2 })` over 2 rows, `add()`, `insert(0)` and `remove(0)` leave 2 items. `console.warn` is called with strings containing `since max is 2` and `since min is 2`.

- [ ] **Step 2: Run to verify they fail**

  Run: `pnpm vitest run --project unit test/unit/formisch-path.test.ts test/unit/formisch-adapter.test.ts`
  Expected: FAIL with module not found for `src/runtime/adapters/formisch`.

- [ ] **Step 3: Implement `toPath`, then the adapter in `src/runtime/adapters/formisch/index.ts`**
  - **Private context:** `InjectionKey<{ store: FormStore; resetCount: Ref<number> }>`. `useForm` throws unless `form` is an object with the `"~internal"` key. Message: `nuxt-ui-forms: no Formisch form found. Pass the store from useForm() in @formisch/vue to <UForm :form="form">.` Then `provide` the context and return the `FormHandle` exactly as the spec's "Formisch adapter behaviour" section lists (`id` from Vue `useId()`; errors keyed by `path.join(".")`).
  - **`useField`:** with no injected context, return the inert handle (local `ref` value, `error` `undefined`, flags `false`, `handleEvent` no-op). Otherwise:
    - Validate the path at setup with a `getFieldStore` probe in `try`, and rethrow as `nuxt-ui-forms: field "<fullName>" is not in the Formisch form's schema.`. `getFieldStore` comes from `@formisch/vue/internals`; using it is fine here, this adapter is the one place coupled to Formisch.
    - Call `useField(store, () => ({ path: path.value }))`. Every read goes through a guard that returns `undefined`/`false` once the field store is gone. Check with `getFieldStore` returning `undefined` for a removed array index.
    - Map events exactly as the spec says. Keep `blurred` as a local ref reset by `watch(resetCount)`.
  - **`useGroup`:** a no-op.
  - **`useArray`:**
    - Wrap `useFieldArray` and the `insert`/`remove`/`move`/`swap` free functions.
    - Guard min/max with `console.warn`, using Formwerk's exact wording: `Cannot add ${count} item(s) to repeater since max is ${max}`, `Cannot insert item to repeater since max is ${max}`, `Cannot remove item from repeater since min is ${min}`.
    - `Iteration` is a `defineComponent` with props `index: Number` and `as: String`. It renders `h(as, attrs, slots.default)` when `as` is set, otherwise `slots.default?.()`, the same as Formwerk's.

- [ ] **Step 4: Run to verify they pass**

  Run: `pnpm vitest run --project unit`
  Expected: PASS for both adapters' contract suites and the Formisch-only cases.

- [ ] **Step 5: Commit** — `feat: add the Formisch runtime adapter`

### Task 3: Register the adapter in the module

**Files:**

- Modify: `src/adapters/index.ts`, `src/adapters/formwerk.ts`
- Create: `src/adapters/formisch.ts`
- Modify: `src/module.ts`, `package.json` (peers)
- Test: `test/unit/adapters.test.ts`

**Interfaces:**

- Produces:
  - `AdapterDefinition.peers: string[]` (replaces `peer`)
  - `export const missingPeersError = (adapter: AdapterDefinition, isResolvable: (id: string) => boolean): string | undefined` in `src/adapters/index.ts`
  - `ModuleOptions.adapter: "formwerk" | "formisch"`

- [ ] **Step 1: Write the failing tests** in `adapters.test.ts`:
  - `resolveAdapter("formisch")` has `peers` equal to `["@formisch/vue", "valibot"]` and `runtimeEntry` `"runtime/adapters/formisch/index"`.
  - `formwerk` peers equal `["@formwerk/core"]`.
  - With neither Formisch peer resolvable, `missingPeersError(formisch, () => false)` equals `[nuxt-ui-forms] The "formisch" adapter requires "@formisch/vue", "valibot". Install them with: pnpm add @formisch/vue valibot`.
  - With only `valibot` missing, the message lists only `valibot`.
  - With everything resolvable, it returns `undefined`.
  - The unknown-adapter message lists `formwerk, formisch`.

- [ ] **Step 2: Run to verify they fail**

  Run: `pnpm vitest run --project unit test/unit/adapters.test.ts`
  Expected: FAIL (`peers` undefined, `missingPeersError` not exported).

- [ ] **Step 3: Implement**
  - Add `formisch: AdapterDefinition = { name: "formisch", peers: ["@formisch/vue", "valibot"], runtimeEntry: "runtime/adapters/formisch/index" }` with no `setup`.
  - Switch Formwerk to `peers`.
  - `module.ts` throws `missingPeersError(...)` when it's defined.
  - Use "Install it with" for one missing peer and "Install them with" for several.
  - Add the peer entries to `package.json` per Global Constraints.

- [ ] **Step 4: Run to verify they pass**

  Run: `pnpm vitest run --project unit && pnpm test:types`
  Expected: PASS.

- [ ] **Step 5: Commit** — `feat: select the Formisch adapter with forms.adapter`

### Task 4: Formisch fixture and shared component tests

**Files:**

- Create: `test/fixtures/formisch/` with `nuxt.config.ts` (`forms: { adapter: "formisch" }`, `ui.colorMode: false`), `package.json`, `app.vue`, and `components/` holding Formisch versions of every component in `test/fixtures/basic/components/`. Use the same file names, props, `data-testid`s and error messages. Each creates its store with `useForm({ schema, initialInput, validate: "initial" })` and renders `<UForm :form="form">`, except `FormWithoutUseForm.vue` and `FieldWithoutForm.vue`. Add `DefaultModesForm.vue` (Formisch defaults, one required `email` field with message `Required`, `data-testid`s `email-field`/`email-input`, and a submit button `submit`).
- Create: `test/fixture-alias.d.ts` (`declare module "#fixture/components/*.vue"` exporting a `DefineComponent`)
- Modify: `vitest.config.ts`, `test/nuxt/*.test.ts`, `test/nuxt/helpers.ts`, `test/e2e/basic.test.ts`

**Interfaces:**

- Consumes: Tasks 1–3.
- Produces: `export const adapterName: "formwerk" | "formisch"` in `test/nuxt/helpers.ts` (from `process.env.NUXT_UI_FORMS_ADAPTER ?? "formwerk"`).

- [ ] **Step 1: Make the nuxt tests fixture-agnostic**
  - Replace `../fixtures/basic/components/X.vue` imports with `#fixture/components/X.vue`.
  - In `vitest.config.ts`, the `nuxt` project gets `test.alias: { "#fixture": <basic dir> }` and `env: { NUXT_UI_FORMS_ADAPTER: "formwerk" }`. Add a `nuxt-formisch` project with the same `include` and devtools `overrides`, `rootDir` set to `test/fixtures/formisch`, the `#fixture` alias to that dir, and `env: { NUXT_UI_FORMS_ADAPTER: "formisch" }`.
  - Adapter-specific branches:
    - `repeater.test.ts`: the remove-keeps-state case becomes `(adapterName === "formwerk" ? it.fails : it)`, and its comment says the limitation is Formwerk-only.
    - `form.test.ts`: split "disabling the form…" into "disabling the form disables the Nuxt UI input" (shared) and `it.runIf(adapterName === "formwerk")("…excludes the field from submitted data")`.
    - `devtools-hub.test.ts`: expect `adapter: adapterName`.
  - Add `it.runIf(adapterName === "formisch")("with Formisch's default modes, errors appear only after a submit attempt and clear on valid input")` in `form.test.ts`, using `DefaultModesForm`:
    1. Blur `email-input`; `errorOf(wrapper, "email-field")` is `undefined`.
    2. Submit; it is `"Required"`.
    3. `interact(wrapper, "email-input", "a@b.co")`; it is `undefined`.

    The `basic` fixture needs no `DefaultModesForm` because the test is skipped there.

  - Add a shared test in `form.test.ts`: "a throwing @submit handler ends the loading state without an unhandled rejection". Add an `onSubmitted` that throws to `BasicForm`, or a `throwOnSubmit` prop. After submit and `settle()`, the email input is not disabled.
  - Formwerk may surface the rejection. If it does, assert the actual Formwerk behaviour in a `runIf` branch rather than changing Formwerk.

- [ ] **Step 2: Run to verify the Formisch project fails before the fixture is complete**

  Run: `pnpm vitest run --project nuxt-formisch`
  Expected: FAIL on the missing fixture components.

- [ ] **Step 3: Write the Formisch fixture components** (Valibot schemas mirroring each zod schema and message)

- [ ] **Step 4: Run both projects**

  Run: `pnpm vitest run --project nuxt --project nuxt-formisch`
  Expected: PASS. In `nuxt-formisch`, the remove-keeps-state case passes as a normal `it`.

- [ ] **Step 5: E2E for both fixtures**

  Turn `basic.test.ts` into `describe.each(["basic", "formisch"])("ssr - %s", ...)`. The Formisch `app.vue` mirrors the basic one (same test ids, `initial@example.com` as initial input, and a schema declaring `email` and `username`). Run: `pnpm vitest run --project e2e`. Expected: PASS.

- [ ] **Step 6: Commit** — `test: run component and SSR tests against a Formisch fixture`

### Task 5: Playground adapter switch

**Files:**

- Modify: `playground/nuxt.config.ts`, `playground/app/app.vue`, `playground/app/pages/index.vue`
- Move: `playground/app/pages/{simple,nested,repeater,validate-on}.vue` → `playground/app/pages/formwerk/`
- Create: `playground/app/pages/formisch/{simple,nested,repeater,validate-on}.vue`, plus a Formisch variant of `components/ValidateOnDemo.vue` (e.g. `ValidateOnDemoFormisch.vue`) if the existing one calls Formwerk's `useForm`.
- Modify: `package.json` scripts

**Interfaces:**

- Produces: `runtimeConfig.public.formsAdapter` (`"formwerk" | "formisch"`), set in `playground/nuxt.config.ts` from `process.env.NUXT_UI_FORMS_ADAPTER ?? "formwerk"`, which also sets `forms.adapter`.

- [ ] **Step 1: Implement**
  - Navigation and index cards build links as `/${formsAdapter}/<page>`. The index subtitle names the active adapter.
  - Formisch pages mirror the Formwerk ones: same fields, messages and demos. Use `validate: "initial"` except on `simple`, which demonstrates Formisch's defaults and says so in its intro text.
  - Add the script `"dev:formisch": "pnpm dev:prepare && NUXT_UI_FORMS_ADAPTER=formisch nuxi dev playground"`.

- [ ] **Step 2: Verify**

  Run: `pnpm test:types && pnpm dev:build && NUXT_UI_FORMS_ADAPTER=formisch pnpm dev:build`
  Expected: both builds succeed.

  Then run `pnpm dev:formisch` and check each Formisch page in a browser: errors gate as described, repeater rows keep state on remove, and the Forms devtools tab lists the form with adapter `formisch`.

- [ ] **Step 3: Commit** — `feat: switch the playground between adapters`

### Task 6: Docs

**Files:**

- Modify: `README.md`, `CLAUDE.md`

- [ ] **Step 1: README**
  - Change the intro and Setup to "Formwerk or Formisch".
  - Add a Formisch section: install (`pnpm add nuxt-ui-forms @formisch/vue valibot`), config, and a usage example with `useForm` + `<UForm :form="form">`.
  - Add the validation-timing paragraph and the differences list, both verbatim in substance from the spec.

- [ ] **Step 2: CLAUDE.md**
  - Layout: add `adapters/formisch.ts` and `runtime/adapters/formisch/`.
  - "How it fits together": `useForm({ form })`, getter `fullName`, the Formisch private injection.
  - Known limitation: Formwerk-only. Tests: the `nuxt-formisch` project, the `#fixture` alias, `capabilities`.
  - Playground: `dev:formisch` and the per-adapter page folders.

- [ ] **Step 3: Full CI check**

  Run: `pnpm lint && pnpm format:check && pnpm test:types && pnpm test && pnpm prepack && pnpm check:prod`
  Expected: all pass.

- [ ] **Step 4: Commit** — `docs: document the Formisch adapter`
