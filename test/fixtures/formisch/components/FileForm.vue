<script lang="ts">
  import { useForm } from "@formisch/vue"
  import * as v from "valibot"

  const schema = v.object({
    avatar: v.optional(v.file()),
  })
</script>

<script setup lang="ts">
  const form = useForm({ schema, initialInput: { avatar: new File(["avatar"], "avatar.png", { type: "image/png" }) } })
</script>

<template>
  <UForm id="upload" :form="form">
    <UFormField name="avatar" label="Avatar">
      <span>avatar</span>
    </UFormField>
  </UForm>
</template>
