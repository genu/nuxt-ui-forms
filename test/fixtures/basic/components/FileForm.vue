<script lang="ts">
  import { useForm } from "@formwerk/core"
</script>

<script setup lang="ts">
  useForm({ initialValues: { avatar: new File(["avatar"], "avatar.png", { type: "image/png" }) } })
</script>

<template>
  <UForm id="upload">
    <UFormField name="avatar" label="Avatar">
      <span>avatar</span>
    </UFormField>
  </UForm>
</template>
