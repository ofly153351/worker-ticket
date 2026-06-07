<template>
  <div class="bg-white dark:bg-slate-900 border-round-lg p-6 shadow-sm flex flex-col" aria-hidden="true">
    <!-- Header: icon + name + status badge -->
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <div class="w-11 h-11 rounded-xl pulse shrink-0" />
        <div class="flex-1 space-y-1.5 min-w-0">
          <div class="h-4 w-3/4 rounded-md pulse" />
          <div class="h-3 w-16 rounded pulse opacity-60" />
        </div>
      </div>
      <div class="h-5 w-14 rounded-full pulse shrink-0" />
    </div>
    <!-- Description -->
    <div class="mt-3 space-y-1.5 flex-1">
      <div class="h-3 w-full rounded pulse opacity-70" />
      <div class="h-3 w-4/5 rounded pulse opacity-50" />
    </div>
    <!-- Stats grid -->
    <div class="grid grid-cols-2 gap-3 mt-4">
      <div class="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5 space-y-1">
        <div class="h-6 w-10 rounded-md pulse" />
        <div class="h-2.5 w-20 rounded pulse opacity-50" />
      </div>
      <div class="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5 space-y-1">
        <div class="h-6 w-8 rounded-md pulse" />
        <div class="h-2.5 w-10 rounded pulse opacity-50" />
      </div>
    </div>
    <!-- Bottom bar -->
    <div class="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
      <div class="h-8 flex-1 rounded-btn pulse" />
      <div class="h-8 w-9 rounded-btn pulse" />
    </div>
  </div>
</template>

<style scoped>
.pulse { @apply animate-pulse bg-slate-200 dark:bg-slate-700/60; }
</style>
