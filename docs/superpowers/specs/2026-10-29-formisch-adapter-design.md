# Formisch adapter

## Intent

`nuxt-ui-forms` puts a form library behind Nuxt UI's form components through a `FormAdapter`. Formwerk is the only adapter today. This adds a second adapter for [Formisch](https://formisch.dev) (`@formisch/vue`, Valibot-based), selected with `forms: { adapter: "formisch" }`, so users can pick Formisch instead of Formwerk.

The project goal this serves: Nuxt- and Nuxt UI-level DX for form libraries. People on Nuxt UI should be able to use these libraries with Nuxt UI's form inputs elegantly, and get devtools through the Nuxt ecosystem. Judge every choice below against that.

The second adapter is also the first real test of the abstraction. Where Formisch does not fit the current contract, change the contract rather than bending Formisch. The goal is a contract that two different libraries implement cleanly.

## Goals

- `forms: { adapter: "formisch" }` works with all four components (`UForm`, `UFormField`, `UFormGroup`, `UFormRepeater`), the `validateOn` gate, and the devtools tab.
- Users write Formisch's own API (`useForm` from `@formisch/vue`, Valibot schemas). The module never wraps or re-exports the library's form creation, the same as with Formwerk.
- Templates look the same under both adapters. The only template difference is that Formisch needs `<UForm :form="form">`.
- The adapter contract suite passes for Formisch, with any gap stated explicitly as a capability, not hidden.

## Non-goals

- Several adapters in one app, or per-form adapter choice. The adapter stays a build-time, app-wide choice.
- Type-checked field names (`name` stays `string`). Formisch's typed paths don't survive our string `name` prop.
- Schema libraries other than Valibot for Formisch (Formisch only supports Valibot).
- Focus-first-invalid-field on submit (Formisch does this through element refs we don't register).

## Anti-goals

- Faking Formwerk semantics in the Formisch adapter that Formisch doesn't have (e.g. stripping disabled fields out of submitted data behind Formisch's back, or forcing a validation mode). That makes the module, not the library, own validation, which breaks the project's premise.
- Wrapping Formisch's `useForm` in a module composable.

## How Formisch differs (from reading `@formisch/vue` 1.1.1 source)

| Concern           | Formwerk                                                                   | Formisch                                                                                                                                                                          |
| ----------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Finding the form  | `useFormContext()` (ancestor's `useForm()` provides it)                    | No context. The store is passed explicitly (`<Form :of="form">`, `useField(form, { path })`)                                                                                      |
| Paths             | dot strings, group/iteration prefixes resolved by the library              | arrays (`["items", 0, "name"]`), always absolute. Every path must exist in the Valibot schema, or `getFieldStore` throws                                                          |
| Validation timing | eager                                                                      | `validate` (default `"submit"`) and `revalidate` (default `"input"`) on `useForm`. Errors are `null` until a mode fires                                                           |
| Touched / blurred | both                                                                       | `isTouched` (set on focus), `isEdited`, `isDirty`. No blurred state                                                                                                               |
| Array rows        | rebuilds row keys on `remove`/`insert`, so rows remount (known limitation) | item ids move with rows. Field stores are index-keyed and state is copied between indices, so a row's component instance survives but its index changes                           |
| Array API         | `add/remove/move/swap/insert`, `min/max`, an `Iteration` component         | free functions `insert(form, { path, at?, initialInput? })`, `remove({ path, at })`, `move({ path, from, to })`, `swap({ path, at, and })`, `replace`. No min/max, no `Iteration` |
| Disabled          | disabled fields are skipped by validation and excluded from data           | no concept                                                                                                                                                                        |
| Submit            | `handleSubmit(handler)`                                                    | `handleSubmit(form, handler)` returns `(event?) => Promise`. Sets `isSubmitted` at the start, catches handler errors into the form's root `errors`                                |
| Reset             | `reset()`                                                                  | `reset(form)`. Also clears `isSubmitted` and re-validates when `validate: "initial"`                                                                                              |
| Snapshot data     | `values`, `getIssues()`                                                    | `getInput(form)`, `getDeepErrorEntries(form)` (`{ path: array, errors }`), `isValid`, `isDirty`, `isSubmitting`                                                                   |

## Contract changes

1. **`useForm` takes options:** `FormAdapter.useForm(options: { form?: unknown }): FormHandle`. `UForm` gets a `form` prop and passes it through. Formwerk ignores it (its context already works when `useForm()` runs in the component that renders `UForm`). Formisch requires it and throws a clear error when it's missing or isn't a Formisch store (check for the `"~internal"` key): `nuxt-ui-forms: pass the store from useForm() in @formisch/vue to <UForm :form="form">.`
2. **Reactive full names:** `FieldOptions.fullName` and `ArrayOptions.fullName` become getters (`() => string`) instead of setup-time snapshots. Formisch rows keep their component instance when a row above them is removed, so the index in the path changes under a live component. `Field.vue` already computes `fullName` reactively; pass the getter. `Repeater.vue` computes it reactively too. Formwerk keeps reading it once where it needs it (`useArray`).
3. **Capabilities in the contract suite:** `AdapterKit` gets `capabilities: { disabledExcludesData: boolean }`. The "disabled field is excluded from submitted data" and "disabled follows a reactive getter" cases run only when it's `true`. Formwerk `true`, Formisch `false`. Keep the flag list minimal: add a flag only for a real library difference, never to skip a bug.
4. **Contract harness:** the suite currently calls `adapter.useForm()` inside a host that creates the library's form. Give `AdapterKit` a way to hand the library form to `useForm({ form })` (e.g. `host` exposes the created form, or a `createForm` hook). Formwerk passes nothing. The exact harness shape is the builder's call.

Fields and arrays get the Formisch store from the adapter, not from core. The Formisch adapter's `useForm` (running in `UForm`'s setup) `provide`s its own private context (store and a reset counter), and its `useField`/`useArray` inject it. Core stays library-agnostic.

## Formisch adapter behaviour

**Peers:** `@formisch/vue` (optional peer `^1.1.1`) and `valibot` (Formisch's own peer). `AdapterDefinition.peer` becomes `peers: string[]` so the missing-peer error prints `pnpm add @formisch/vue valibot`. No alias `setup` is needed (Formisch has no injection context to duplicate).

**`useForm({ form })`:**

- `id`: Vue `useId()`.
- `submitAttempted`: `computed(() => store.isSubmitted)`.
- `submit(handler)`: `handleSubmit(store, (output) => handler(output))`. Handler errors are caught by Formisch into the form's root errors, not rethrown. Document this.
- `reset()`: `reset(store)`, then bump the reset counter so blurred state clears.
- `snapshot()`: `values: getInput(store)`, errors from `getDeepErrorEntries(store)` keyed by `path.join(".")` (root-level entries keyed `""`), `valid: store.isValid`, `dirty: store.isDirty`, `submitting: store.isSubmitting`.

**`useField({ fullName, disabled })`:**

- Path: `computed(() => toPath(fullName()))`, splitting on `.` and turning numeric segments into numbers. `useField(store, () => ({ path: path.value }))` from `@formisch/vue` (it accepts getters).
- `value`/`setValue`: `field.input` getter/setter. The setter triggers Formisch's `"input"` mode.
- `error`: first of `field.errors`. `touched`: `field.isTouched`. `dirty`: `field.isDirty`.
- `blurred`: a local `ref(false)` per field instance, reset when the reset counter changes. Per-instance is correct because Formisch rows keep their instance when they move.
- `handleEvent`: `blur` sets blurred and calls `field.props.onBlur()`. `focus`, `input` and `change` call `field.props.onFocus()` (marks touched, fires the `"touch"` mode), and `change` also calls `field.props.onChange()`. This matches the Formwerk mapping (blur = blurred, anything else = touched) and lets Formisch's `validate`/`revalidate` modes fire naturally.
- `disabled` is ignored (capability `false`). Nuxt UI still disables the input through `UForm`'s `disabled`.
- **Outside any `UForm`** (no injected store), return an inert handle: a local value ref, no error, all flags `false`, `handleEvent` a no-op, nothing logged. This keeps the existing guarantee in `test/nuxt/field.test.ts` ("outside any UForm renders its label and slot, never shows library errors and logs nothing"). It isn't a fake standalone Formisch field: there is no validation. Make "useField without a form never errors" a shared contract case, and share that nuxt test across both fixtures. (Design call, not asked.)

**`useGroup`:** a no-op. Our name scope already builds the full name, and the Formisch adapter only uses `fullName`.

**`useArray({ fullName, min, max })`:**

- `useFieldArray(store, () => ({ path: path.value }))`. `items` is the item id list.
- `add(count = 1)`, `insert(index)`: `insert(store, { path, at })`, stopping at `max`. `remove(index)`: stops at `min`. `move`, `swap`: straight through.
- Match Formwerk's `min`/`max` semantics as the contract and nuxt tests pin them. The builder should check what Formwerk does for an initial array shorter than `min` and mirror it.
- `Iteration`: a small component with the same props (`index`, `as`) and render semantics as Formwerk's (check its default `as`), rendering the default slot.

## Validation timing and the `validateOn` gate

The library owns timing; `validateOn` only gates visibility. With Formisch:

- `validate` / `revalidate` on Formisch's `useForm` decide when errors are computed.
- `validateOn` on `UForm` decides when computed errors are shown. A submit attempt shows all errors.

Under Formisch's default (`validate: "submit"`) there are no errors to show before the first submit, so the gate has no visible effect until then. For Formwerk-like behaviour (errors appear on blur), the README tells users to set `validate: "initial"` (or `"blur"`). The adapter never overrides the user's mode.

## Docs and playground

**README:** a Formisch section next to Formwerk covering install, `useForm` + `<UForm :form>`, the validation-timing note above, and a short "differences" list: schema must declare every field, Valibot only, `disabled` doesn't exclude data, handler errors are caught by Formisch, rows keep their state on remove/insert.

**Playground:** one playground with an adapter switch. `playground/nuxt.config.ts` reads `NUXT_UI_FORMS_ADAPTER` (default `formwerk`). Pages move to `pages/formwerk/*` and new `pages/formisch/*` with the same four demos (`simple`, `nested`, `repeater`, `validate-on`). The index page links to the active adapter's pages. Add a `dev:formisch` script. `check:prod` stays on the default adapter.

**CLAUDE.md:** update the layout, the "How it fits together" contract notes, the known-limitation section (Formwerk-only), and the playground notes.

## Tests

- **Unit:** `test/unit/formisch-adapter.test.ts` runs the contract with a Valibot schema. Add unit tests for `toPath` and for the peer check printing both packages.
- **Nuxt:** a new fixture `test/fixtures/formisch` (`forms: { adapter: "formisch" }`) and a second nuxt Vitest project (`nuxt-formisch`) whose tests cover the component behaviour under Formisch: field errors through the gate, groups, repeater add/remove/move, and a passing test that rows keep blurred/touched state across `remove`/`insert` (the counterpart of Formwerk's `it.fails`). Also the missing-`form`-prop error and the devtools hub snapshot.
- **E2E:** SSR render of the Formisch fixture.
- `pnpm test:types`, `lint`, `format:check`, `test`, `prepack`, `check:prod` all pass.

## Left to the builder

- The exact contract-harness shape for passing the library form.
- Whether `UForm`'s `form` prop is typed `object` or `unknown` (keep it loose for now; typed per-adapter props are a non-goal).
- How nuxt tests are shared or duplicated across the two fixtures. Prefer sharing the adapter-agnostic cases where it stays readable.
- Pinned versions: `@formisch/vue` 1.1.1 and `valibot` 1.5.0 as devDependencies.
