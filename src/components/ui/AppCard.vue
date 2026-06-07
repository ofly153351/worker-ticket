<template>
  <div
    :class="[
      'bg-white dark:bg-slate-900 border-round-lg',
      'shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.10)]',
      'transition-all duration-200',
      interactive ? 'hover:-translate-y-0.5 hover:shadow-md cursor-pointer' : '',
      pad ? 'p-6' : '',
      className,
    ]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ pad?: boolean; className?: string; interactive?: boolean }>(), { pad: true })
</script>
