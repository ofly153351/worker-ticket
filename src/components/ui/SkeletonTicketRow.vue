<template>
  <tr aria-hidden="true">
    <!-- Ticket title + ID -->
    <td class="px-4 py-3.5">
      <div class="flex items-center gap-2.5">
        <div class="flex-1 space-y-1.5">
          <div class="h-4 w-3/4 pulse" />
          <div class="h-2.5 w-24 pulse opacity-60" />
        </div>
      </div>
    </td>
    <!-- Project chip -->
    <td class="px-4 py-3.5">
      <div class="h-5 w-16 rounded-full pulse" />
    </td>
    <!-- Severity badge -->
    <td class="px-4 py-3.5">
      <div class="h-5 w-14 rounded-full pulse" />
    </td>
    <!-- Status badge -->
    <td class="px-4 py-3.5">
      <div class="h-5 w-20 rounded-full pulse" />
    </td>
    <!-- Reporter -->
    <td class="px-4 py-3.5">
      <div class="flex items-center gap-2">
        <div class="h-6 w-6 rounded-full pulse shrink-0" />
        <div class="h-3.5 w-20 pulse hidden xl:block" />
      </div>
    </td>
    <!-- Date -->
    <td class="px-4 py-3.5">
      <div class="h-3.5 w-24 pulse" />
    </td>
    <!-- Actions -->
    <td class="px-4 py-3.5 text-right">
      <div class="h-7 w-7 rounded-lg pulse ml-auto" />
    </td>
  </tr>
</template>

<style scoped>
.pulse { @apply animate-pulse rounded-md bg-slate-200 dark:bg-slate-700/60; }
</style>
