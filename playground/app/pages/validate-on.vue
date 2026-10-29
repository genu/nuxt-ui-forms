<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">validateOn</h1>
      <p class="mt-1 text-muted">
        Formwerk validates on every change. <code>validateOn</code> only decides when a field's error becomes visible. A submit attempt
        shows every error regardless of the gate.
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <ValidateOnDemo validate-on="blur" description="Shown once the field has lost focus." />
      <ValidateOnDemo validate-on="touched" description="Shown as soon as the field is focused or edited." />
      <ValidateOnDemo validate-on="dirty" description="Shown once the value differs from its initial value." />
    </div>
  </div>
</template>
