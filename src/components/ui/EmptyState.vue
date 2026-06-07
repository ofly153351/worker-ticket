<template>
  <div class="flex flex-col items-center justify-center text-center py-16 px-6">
    <div class="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
      <AppIcon :name="icon" :size="26" />
    </div>
    <h3 class="text-base font-semibold text-slate-800 dark:text-slate-100">{{ title }}</h3>
    <p v-if="body" class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{{ body }}</p>
    <div v-if="$slots.action" class="mt-5"><slot name="action" /></div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from './AppIcon.vue'
withDefaults(defineProps<{ icon?: string; title: string; body?: string }>(), { icon: 'inbox' })
</script>
