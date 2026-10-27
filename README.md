# nuxt-ui-forms

> [!WARNING]
> Alpha (0.x). APIs change without deprecation.

Form components for [Nuxt UI](https://ui.nuxt.com/) backed by a form library adapter. The form library owns state, validation and errors; Nuxt UI only renders. The only adapter today is [Formwerk](https://formwerk.dev/) (`@formwerk/core`).

## Setup

```bash
pnpm add nuxt-ui-forms @formwerk/core
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@nuxt/ui", "nuxt-ui-forms"],
  forms: {
    adapter: "formwerk", // default, currently the only adapter
  },
})
```

- `@nuxt/ui` (^4) is a required peer dependency.
- `@formwerk/core` (^0.14.4) is an optional peer dependency, needed only for the `formwerk` adapter. If the selected adapter's library is missing, the module throws at setup with the install command.

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
- `UFormField` renders `NuxtUiFormField` with `error` taken from the form library. It listens to Nuxt UI's form events (`blur`, `focus`, `change`, `input`) for its own full name and forwards them to the adapter. With Formwerk, `blur` marks the field blurred and the other events mark it touched.

## Usage

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
  const { values } = useForm({ schema })

  const onSubmit = async ({ data }: { data: unknown }) => {
    await $fetch("/api/signup", { method: "POST", body: data })
  }
</script>

<template>
  <UForm v-slot="{ blurredFields }" @submit="onSubmit">
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

### `UForm`

| Prop         | Type                                                  | Default  |
| ------------ | ----------------------------------------------------- | -------- |
| `validateOn` | `"blur" \| "touched" \| "dirty"`                      | `"blur"` |
| `disabled`   | `boolean`                                             | `false`  |
| `id`         | `string`                                              | form id  |
| `onSubmit`   | `(event: { data: unknown }) => void \| Promise<void>` |          |

- `onSubmit` is a function prop, so `@submit="handler"` binds to it. It runs only when the library's validation passes, `data` is the validated output, and it is awaited (Nuxt UI's form loading state stays on until it resolves).
- `disabled` disables the Nuxt UI inputs and the library fields. Formwerk leaves disabled fields out of the submitted data.
- Default slot props: `blurredFields`, `touchedFields`, `dirtyFields` (`ReadonlySet<string>` of full field names such as `contacts.0.email`).

#### `validateOn` is an error-visibility gate

The form library validates on every change. `validateOn` only decides when a field's error is shown:

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

## Known limitations

- Formwerk 0.14.4 rebuilds every row key after `remove` and `insert`, so all rows remount and lose their blurred and touched state (errors hide again until the gate is met, unless a submit was attempted). Values are kept. `move` and `swap` keep row state.

## Development

```bash
pnpm install
pnpm dev:prepare   # stub build + generate types for the module and playground
pnpm dev           # playground at http://localhost:3000
pnpm dev:build     # build the playground
pnpm lint          # ESLint (@nuxt/eslint-config + Prettier)
pnpm format:check  # Prettier
pnpm test:types    # vue-tsc for the module and the playground
pnpm test          # Vitest: unit, nuxt and e2e projects
pnpm prepack       # build the module
```

The playground has a page per scenario: `/simple`, `/nested`, `/repeater` and `/validate-on`.

## License

[MIT](./LICENSE)
