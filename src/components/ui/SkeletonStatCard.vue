<template>
  <div class="bg-white dark:bg-slate-900 border-round-lg p-6 shadow-sm" aria-hidden="true">
    <div class="flex items-start justify-between">
      <!-- Icon box -->
      <div class="h-10 w-10 rounded-xl pulse" />
    </div>
    <div class="mt-4 space-y-2">
      <!-- Value -->
      <div class="h-8 w-16 rounded-lg pulse" />
      <!-- Label -->
      <div class="h-3.5 w-28 rounded-md pulse opacity-70" />
    </div>
  </div>
</template>

<style scoped>
.pulse { @apply animate-pulse bg-slate-200 dark:bg-slate-700/60; }
</style>
