# nuxt-ui-forms

> [!WARNING]
> Alpha (0.x). APIs change without deprecation.

Form components for [Nuxt UI](https://ui.nuxt.com/) backed by a form library adapter. The form library owns state, validation and errors; Nuxt UI only renders. Two adapters ship: [Formwerk](https://formwerk.dev/) (`@formwerk/core`, the default) and [Formisch](https://formisch.dev/) (`@formisch/vue` with Valibot). One adapter is active per app.

## Setup

```bash
pnpm add nuxt-ui-forms @formwerk/core
# or
pnpm add nuxt-ui-forms @formisch/vue valibot
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@nuxt/ui", "nuxt-ui-forms"],
  forms: {
    adapter: "formwerk", // default, or "formisch"
  },
})
```

- `@nuxt/ui` (^4.12.0) is a required peer dependency. Only 4.12.0 is tested.
- The form libraries are optional peer dependencies, needed only for their adapter: `@formwerk/core` (^0.14.4) for `formwerk`, `@formisch/vue` (^1.1.1) and `valibot` (^1.4.1) for `formisch`. If the selected adapter's libraries are missing, the module throws at setup with the install command.

## Components

| Component       | What it does                                                             |
| --------------- | ------------------------------------------------------------------------ |
| `UForm`         | Overrides Nuxt UI's `UForm`. Connects the form library to Nuxt UI.       |
| `UFormField`    | Overrides Nuxt UI's `UFormField`. Registers a field and shows its error. |
| `UFormGroup`    | Prefixes the names of the fields inside it (`address` → `address.city`). |
| `UFormRepeater` | Array fields: add, remove, move, swap and insert rows.                   |

Components follow your Nuxt UI prefix (`ui.prefix`, default `U`). With `prefix: "N"` they are `NForm`, `NFormField`, `NFormGroup` and `NFormRepeater`.

### How the override works

The module renames Nuxt UI's `Form` and `FormField` to `NuxtUiForm` and `NuxtUiFormField` and registers its own components under the original names. Both originals stay available under those names.

- `UForm` renders `NuxtUiForm` without a schema, with `validate-on="[]"` and `validate-on-input-delay="0"`, so Nuxt UI never validates. You keep its `<form>` element, loading state and disabled propagation.
- `UFormField` renders `NuxtUiFormField` with `error` taken from the form library. It listens to Nuxt UI's form events (`blur`, `focus`, `change`, `input`) for its own full name and forwards them to the adapter. With both adapters, `blur` marks the field blurred and the other events mark it touched.

## Usage

### Formwerk

Create the form with the library in the component that renders `UForm` (or any ancestor):

```vue
<script lang="ts">
  import { useForm } from "@formwerk/core"
  import { z } from "zod"

  const schema = z.object({
    email: z.email({ error: "Enter a valid email address" }),
    acceptTerms: z.boolean().refine((accepted) => accepted, "You must accept the terms"),
    address: z.object({
      city: z.string().min(1, "City is required"),
    }),
  })
</script>

<script setup lang="ts">
  useForm({ schema })

  const onSubmit = async ({ data }: { data: unknown }) => {
    await $fetch("/api/signup", { method: "POST", body: data })
  }
</script>

<template>
  <UForm @submit="onSubmit">
    <UFormField v-slot="{ model }" name="email" label="Email">
      <UInput v-bind="model" />
    </UFormField>

    <UFormField v-slot="{ model }" name="acceptTerms">
      <UCheckbox v-bind="model" label="I accept the terms" />
    </UFormField>

    <UFormGroup name="address">
      <UFormField v-slot="{ model }" name="city" label="City">
        <UInput v-bind="model" />
      </UFormField>
    </UFormGroup>

    <UButton type="submit" label="Submit" />
  </UForm>
</template>
```

### Formisch

Create the store with Formisch's `useForm` and pass it to `UForm` with the `form` prop. Everything inside `UForm` is the same as with Formwerk:

```vue
<script lang="ts">
  import { useForm } from "@formisch/vue"
  import * as v from "valibot"

  const schema = v.object({
    email: v.pipe(v.string("Enter a valid email address"), v.email("Enter a valid email address")),
    acceptTerms: v.pipe(
      v.boolean("You must accept the terms"),
      v.check((accepted) => accepted, "You must accept the terms"),
    ),
    address: v.object({
      city: v.pipe(v.string(), v.minLength(1, "City is required")),
    }),
  })
</script>

<script setup lang="ts">
  const form = useForm({ schema, validate: "initial" })

  const onSubmit = async ({ data }: { data: unknown }) => {
    await $fetch("/api/signup", { method: "POST", body: data })
  }
</script>

<template>
  <UForm :form="form" @submit="onSubmit">
    <UFormField v-slot="{ model }" name="email" label="Email">
      <UInput v-bind="model" />
    </UFormField>

    <UFormField v-slot="{ model }" name="acceptTerms">
      <UCheckbox v-bind="model" label="I accept the terms" />
    </UFormField>

    <UFormGroup name="address">
      <UFormField v-slot="{ model }" name="city" label="City">
        <UInput v-bind="model" />
      </UFormField>
    </UFormGroup>

    <UButton type="submit" label="Submit" />
  </UForm>
</template>
```

Formisch decides when errors are computed (`validate` and `revalidate` on its `useForm`); `validateOn` on `UForm` decides when computed errors are shown. Under Formisch's default `validate: "submit"` there are no errors before the first submit, so the gate has nothing to show until then. For errors that appear on blur, as with Formwerk, set `validate: "initial"` (or `"blur"`). The adapter never overrides your modes.

How it differs from Formwerk:

- The Valibot schema must declare every field you render. A `UFormField` or `UFormRepeater` whose full name is not in the schema, or points at an array item that does not exist, throws a `nuxt-ui-forms:` error naming it.
- Valibot is the only schema library.
- `disabled` disables the Nuxt UI inputs but does not remove fields from the submitted data or from validation.
- An error thrown by the `@submit` handler is caught by Formisch and stored as a form-level error (shown in the devtools tab), not rethrown.
- Repeater rows keep their blurred and touched state through `remove` and `insert`.
- `UFormRepeater`'s `min` only guards `remove`. It does not add rows to an initial array shorter than `min` (Formwerk renders the extra rows); put enough rows in `initialInput`.

### `UForm`

| Prop         | Type                                                  | Default  |
| ------------ | ----------------------------------------------------- | -------- |
| `validateOn` | `"blur" \| "touched" \| "dirty"`                      | `"blur"` |
| `disabled`   | `boolean`                                             | `false`  |
| `id`         | `string`                                              | form id  |
| `form`       | `object`                                              |          |
| `onSubmit`   | `(event: { data: unknown }) => void \| Promise<void>` |          |

- `onSubmit` is a function prop, so `@submit="handler"` binds to it. It runs only when the library's validation passes, `data` is the validated output, and it is awaited (Nuxt UI's form loading state stays on until it resolves).
- `form` is the library's form. Formisch requires it (the store from its `useForm()`); Formwerk ignores it and finds its form through `useForm()` in an ancestor.
- `disabled` disables the Nuxt UI inputs and the library fields. Formwerk leaves disabled fields out of the submitted data; Formisch keeps them.
- Default slot props: `blurredFields`, `touchedFields`, `dirtyFields` (`ReadonlySet<string>` of full field names such as `contacts.0.email`).
- Nuxt UI's `schema`, `state` and `validate` props are not supported: validation belongs to the form library. They are not forwarded to Nuxt UI's form, and passing them logs a warning in development.
- `UForm` does not expose Nuxt UI's template-ref API (`submit()`, `validate()`, `clear()`, `setErrors()`). Use the form library's API instead.

#### `validateOn` is an error-visibility gate

The form library decides when errors are computed (Formwerk on every change, Formisch by its `validate`/`revalidate` modes). `validateOn` only decides when a field's error is shown:

| Value     | Error shows once the field is                |
| --------- | -------------------------------------------- |
| `blur`    | blurred (lost focus at least once)           |
| `touched` | touched (focused or edited)                  |
| `dirty`   | dirty (value differs from its initial value) |

After a submit attempt every error is shown, whatever the gate.

### `UFormField`

Takes every Nuxt UI `FormField` prop except `error`, `eagerValidation`, `validateOnInputDelay` and `errorPattern`. `name` is required. Inside a group or repeater, use the relative name; the full name (`address.city`, `contacts.1.email`) is used for the input's `name`, ids, events and the field sets.

Default slot props:

| Prop        | Description                                                   |
| ----------- | ------------------------------------------------------------- |
| `model`     | `{ modelValue, "onUpdate:modelValue" }`, spread with `v-bind` |
| `value`     | Current value                                                 |
| `setValue`  | `(value) => void`                                             |
| `isTouched` | Field is touched                                              |
| `isBlurred` | Field is blurred                                              |
| `isDirty`   | Field is dirty                                                |

### `UFormGroup`

```vue
<UFormGroup name="address">
  <UFormField v-slot="{ model }" name="street" label="Street">
    <UInput v-bind="model" />
  </UFormField>
</UFormGroup>
```

`name` is required. Groups nest, and a `UFormRepeater` inside a group resolves to the prefixed path (`user.contacts.0.name`).

### `UFormRepeater`

```vue
<UFormRepeater name="contacts" :min="1" :max="5" :ui="{ item: 'rounded-lg border p-4' }">
  <template #default="{ index, items, isFirst, isLast, repeater }">
    <UFormField v-slot="{ model }" name="email" label="Email">
      <UInput v-bind="model" />
    </UFormField>
    <UButton label="Up" :disabled="isFirst" @click="repeater.move(index, index - 1)" />
    <UButton label="Down" :disabled="isLast" @click="repeater.move(index, index + 1)" />
    <UButton label="Insert below" @click="repeater.insert(index + 1)" />
    <UButton label="Remove" :disabled="items.length <= 1" @click="repeater.remove(index)" />
  </template>

  <template #trailing="{ repeater }">
    <UButton label="Add contact" @click="repeater.add()" />
  </template>
</UFormRepeater>
```

| Prop   | Type                                                                    |
| ------ | ----------------------------------------------------------------------- |
| `name` | `string` (required)                                                     |
| `min`  | `number`, removing below it is a no-op with a console warning           |
| `max`  | `number`, adding above it is a no-op with a console warning             |
| `ui`   | `{ root?, leading?, wrapper?, item?, trailing? }` classes for each slot |

Slots:

- `default`: one row. Props `index`, `items`, `isFirst`, `isLast`, `repeater`.
- `leading` and `trailing`: before and after the rows. Props `items`, `repeater`.
- `wrapper`: replaces the row container. Props `items`, `repeater`, `Iteration`.

`repeater` methods:

```ts
interface RepeaterMethods {
  add: (count?: number) => void
  remove: (index: number) => void
  move: (from: number, to: number) => void
  swap: (indexA: number, indexB: number) => void
  insert: (index: number) => void // inserts one row
}
```

`items` holds one stable key per row; use it as the `v-for` key.

#### Custom layout with the `wrapper` slot

Each row must be rendered through the `Iteration` component, which scopes the row's field names. It is a slot prop, so render it with `<component :is>` (a plain `<Iteration>` tag would be resolved as a registered component, not the slot prop):

```vue
<UFormRepeater name="tags">
  <template #wrapper="{ items, Iteration, repeater }">
    <div class="flex gap-2">
      <component :is="Iteration" v-for="(key, index) in items" :key="key" :index="index" as="div">
        <UFormField v-slot="{ model }" name="label">
          <UInput v-bind="model" />
        </UFormField>
        <UButton label="Remove" @click="repeater.remove(index)" />
      </component>
    </div>
  </template>
</UFormRepeater>
```

`as` sets the element `Iteration` renders; without it the row renders without a wrapper element.

## Devtools

In development the module adds a read-only **Forms** tab to [Nuxt DevTools](https://devtools.nuxt.com/) (under the Nuxt group of the dock). It lists every mounted `UForm` and updates live while you use the app:

- The adapter name once in the list header, and per form one line: the id plus compact indicators (hover for the name) for the active states: invalid or valid, submit attempted, dirty, submitting. The detail view shows all of them as badges.
- A field tree built from the full field names (`address.city`, `contacts.0.email`), with each field's value, touched, blurred and dirty badges, and an error marker that shows the field's errors on hover or focus.
- The form values as JSON (with a Copy button) and the list of form errors.

The tab only reads state: it does not edit values or trigger submit or reset.

- Requires `@nuxt/devtools@4`, installed by your app (`pnpm add -D @nuxt/devtools@4`). Nuxt 4.6 still bundles DevTools v3; with v3 the tab is not registered and nothing breaks.
- Development only. Nothing from it is included in production builds.
- Form values, passwords included, are shown unmasked in the tab. It only exists in development and only on your machine.
- DevTools v4 asks for a one-time authorization code the first time you open it in a browser. The code is printed in the terminal running `nuxi dev`.
- To turn the tab off, set `forms: { devtools: false }`.

## Known limitations

- Hydration was verified manually in the playground. It is not covered by automated tests.
- Formwerk 0.14.4 rebuilds every row key after `remove` and `insert`, so all rows remount and lose their blurred and touched state (errors hide again until the gate is met, unless a submit was attempted). Values are kept. `move` and `swap` keep row state. Formisch is not affected.

## Development

```bash
pnpm install
pnpm dev:prepare   # stub build + generate types for the module, playground and devtools client
pnpm dev           # playground at http://localhost:3000 (Formwerk)
pnpm dev:formisch  # the same playground on the Formisch adapter
pnpm dev:build     # build the playground
pnpm client:dev    # devtools client dev server on port 3300
pnpm client:build  # build the devtools client to dist/client
pnpm lint          # ESLint (@nuxt/eslint-config + Prettier)
pnpm format:check  # Prettier
pnpm test:types    # vue-tsc for the module, the playground and the devtools client
pnpm test          # Vitest: unit, nuxt (Formwerk fixture), nuxt-formisch and e2e projects
pnpm prepack       # build the module and the devtools client
pnpm check:prod    # after prepack: dist/client exists and a production playground build has no devtools code
```

The playground has a page per scenario and adapter: `/<adapter>/simple`, `/<adapter>/nested`, `/<adapter>/repeater` and `/<adapter>/validate-on`, where `<adapter>` is the active one (`NUXT_UI_FORMS_ADAPTER`, default `formwerk`).

To work on the devtools tab, run `pnpm client:dev` and `pnpm dev` side by side. The stubbed module proxies the tab's route to the client dev server; the published build serves `dist/client` instead.

## License

[MIT](./LICENSE)
