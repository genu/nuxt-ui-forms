# CLAUDE.md

Guidance for working in this repository.

## Project

`nuxt-ui-forms` is a Nuxt module that puts a form library behind Nuxt UI's form components. The library owns state, validation and errors; Nuxt UI only renders. Components never import a form library: they talk to a `FormAdapter`, and the module bundles the adapter chosen with `forms: { adapter: "formwerk" }` (default and only adapter today).

Alpha (0.x): change behaviour freely, no compatibility shims.

## Layout

```
src/
├── module.ts                      # setup: adapter selection, NuxtUi* rename, component registration
├── adapters/                      # build-time adapter definitions (peer to check, runtime entry, setup hook)
│   ├── index.ts                   # registry + resolveAdapter
│   └── formwerk.ts                # aliases @formwerk/core to one instance
└── runtime/
    ├── adapters/formwerk/index.ts # FormAdapter implementation on @formwerk/core
    ├── components/                # Form.vue, Field.vue, Group.vue, Repeater.vue (registered as <prefix>Form, FormField, FormGroup, FormRepeater)
    ├── core/                      # library-agnostic logic
    │   ├── types.ts               # FormAdapter, FormHandle, FieldHandle, ArrayHandle, ValidateOn
    │   ├── use-adapter.ts         # imports the selected adapter from #nuxt-ui-forms/adapter
    │   ├── name-scope.ts          # group/iteration prefixes -> full field names
    │   ├── scoped-iteration.ts    # wraps the adapter's Iteration to provide the row name scope
    │   ├── error-visibility.ts    # validateOn gate
    │   ├── form-context.ts        # validateOn, disabled, submitAttempted for fields
    │   ├── form-registry.ts       # blurred/touched/dirty field sets for UForm's slot
    │   └── nuxt-ui-keys.ts        # Nuxt UI form bus injection key
    └── types/index.ts             # public types (re-exported from the package root)
```

## How it fits together

- `module.ts` resolves the adapter, throws if its peer (`@formwerk/core`) is not installed, aliases `#nuxt-ui-forms/adapter` to the adapter's runtime entry, renames Nuxt UI's `<prefix>Form`/`<prefix>FormField` to `NuxtUiForm`/`NuxtUiFormField`, and registers our four components with the Nuxt UI prefix (`ui.prefix`, default `U`).
- `UForm` calls `adapter.useForm()` (Formwerk: `useFormContext()`, so `useForm()` must run in an ancestor) and renders `NuxtUiForm` with `validate-on="[]"` and `validate-on-input-delay="0"` so Nuxt UI never validates. `onSubmit` is a function prop; `FormHandle.submit(handler)` calls it with validated data only and is awaited.
- `UFormField` computes its full name from the name scope, calls `adapter.useField({ name, fullName, ... })`, subscribes to Nuxt UI's form bus filtered by full name and forwards `blur | focus | change | input` to `handleEvent`. The adapter decides what an event means. The shown error is `isErrorVisible(...) ? field.error : undefined`.
- `validateOn` (`blur | touched | dirty`) is an error-visibility gate, not validation timing. A submit attempt (`FormHandle.submitAttempted`) shows all errors.
- `UFormGroup` calls `adapter.useGroup` and provides a name scope. `UFormRepeater` calls `adapter.useArray({ name, fullName, min, max })` and wraps the returned `Iteration` so each row provides `<fullName>.<index>` as scope. Formwerk's `useFormRepeater` ignores parent path prefixes, so the Formwerk adapter passes it `fullName`.
- Wrapper slot users must render `Iteration` with `<component :is="Iteration">`.

## Known limitation

Formwerk 0.14.4 rebuilds every repeater row key on `remove`/`insert`, so rows remount and lose blurred/touched state. Covered by an `it.fails` case in `test/nuxt/repeater.test.ts`; flip it to `it` when Formwerk fixes it.

## Commands

```bash
pnpm dev:prepare   # stub build + types for module and playground (run after install)
pnpm dev           # playground
pnpm dev:build     # build playground
pnpm lint          # ESLint (@nuxt/eslint-config + eslint-plugin-prettier)
pnpm lint:fix
pnpm format        # Prettier
pnpm format:check
pnpm test:types    # vue-tsc, module then playground
pnpm test          # vitest run (all projects)
pnpm vitest run --project unit|nuxt|e2e
pnpm prepack       # module build
```

## Tests

Vitest with three projects (`vitest.config.ts`):

- `unit` (happy-dom): core helpers and the adapter contract suite. `test/unit/contract/adapter-contract.ts` defines behaviour every adapter must pass; `test/unit/formwerk-adapter.test.ts` runs it for Formwerk. A new adapter gets its own runner file.
- `nuxt` (`@nuxt/test-utils` runtime, fixture `test/fixtures/basic`): component behaviour through `mountSuspended`. Fixture components live in `test/fixtures/basic/components/`.
- `e2e` (SSR via `@nuxt/test-utils/e2e`): `basic` and `custom-prefix` fixtures.

## Playground

`playground/app/pages/`: `simple`, `nested` (groups plus a repeater inside a group), `repeater` (default and `wrapper` slots, min/max), `validate-on` (three forms, one per gate, via `components/ValidateOnDemo.vue`). Pages import types from `nuxt-ui-forms`, which resolves through the package's own `exports` after `pnpm dev:prepare`, so the playground has no `package.json` of its own.

## Conventions

- pnpm only. Exact versions for dependencies; peers keep ranges.
- Vue SFCs: imports and interfaces in a plain `<script lang="ts">` block, logic in `<script setup lang="ts">`. Props/Slots/Emits interfaces first, prop destructuring for defaults.
- Composables: `export const useX = () => { ...; return { ... } }`.
- Prettier `bracketSameLine` and the ESLint `vue/html-closing-bracket-newline` rule disagree on multi-line non-self-closing tags; keep those tags on one line (move long bindings into the script).
- Few comments; self-explanatory code.
- Conventional Commits (release-please generates the changelog).
