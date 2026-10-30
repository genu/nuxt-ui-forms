<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">validateOn</h1>
      <p class="mt-1 text-muted">
        These forms use <code>validate: "initial"</code>, so Formisch computes every error up front. <code>validateOn</code> only
        decides when a field's error becomes visible. A submit attempt shows every error regardless of the gate.
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <FormischValidateOnDemo validate-on="blur" description="Shown once the field has lost focus." />
      <FormischValidateOnDemo validate-on="touched" description="Shown as soon as the field is focused or edited." />
      <FormischValidateOnDemo validate-on="dirty" description="Shown once the value differs from its initial value." />
    </div>
  </div>
</template>
