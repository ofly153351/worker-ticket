<template>
  <div class="bg-white dark:bg-slate-900 border-round-lg shadow-sm overflow-hidden" aria-hidden="true">
    <!-- Header band -->
    <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/40">
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <div class="w-10 h-10 rounded-xl pulse shrink-0" />
        <div class="flex-1 space-y-1.5 min-w-0">
          <div class="h-4 w-36 rounded-md pulse" />
          <div class="h-3 w-24 rounded pulse opacity-60" />
        </div>
      </div>
      <div class="text-right space-y-1 shrink-0">
        <div class="h-7 w-8 rounded-lg pulse ml-auto" />
        <div class="h-3 w-12 rounded pulse opacity-50" />
      </div>
    </div>
    <!-- Body -->
    <div class="p-6 space-y-5">
      <!-- Severity pills -->
      <div class="flex flex-wrap gap-2">
        <div v-for="i in 4" :key="i" class="h-7 w-20 rounded-lg pulse" />
      </div>
      <!-- Bar -->
      <div class="h-1.5 w-full rounded-full pulse" />
      <!-- Executive summary lines -->
      <div class="space-y-2">
        <div class="h-2.5 w-24 rounded pulse opacity-60" />
        <div class="h-3.5 w-full rounded-md pulse" />
        <div class="h-3.5 w-11/12 rounded-md pulse opacity-80" />
        <div class="h-3.5 w-3/4 rounded-md pulse opacity-60" />
      </div>
      <!-- Action items -->
      <div class="space-y-2">
        <div class="h-2.5 w-20 rounded pulse opacity-60" />
        <div v-for="i in 2" :key="i" class="h-9 w-full rounded-lg pulse opacity-70" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.pulse { @apply animate-pulse bg-slate-200 dark:bg-slate-700/60; }
</style>
