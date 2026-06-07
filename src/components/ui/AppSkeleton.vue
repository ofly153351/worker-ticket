<template>
  <div :class="['animate-pulse bg-slate-200/80 dark:bg-slate-700/60 rounded-md', className]" />
</template>

<script setup lang="ts">
defineProps<{ className?: string }>()
</script>
