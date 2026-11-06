<template>
  <UFormField v-slot="{ model }" data-testid="email-field" name="email" label="Email">
    <UInput v-bind="model" data-testid="email-input" />
  </UFormField>
</template>
