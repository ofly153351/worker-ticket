<template>
  <div class="flex flex-col items-center justify-center text-center py-16 px-6">
    <div class="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500 mb-4">
      <AppIcon name="alert" :size="26" />
    </div>
    <h3 class="text-base font-semibold text-slate-800 dark:text-slate-100">Something went wrong</h3>
    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
      {{ message || 'We couldn\'t reach the API. Check your connection and try again.' }}
    </p>
    <div v-if="onRetry" class="mt-5">
      <AppButton variant="secondary" icon="refresh" @click="$emit('retry')">Retry</AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon   from './AppIcon.vue'
import AppButton from './AppButton.vue'
defineProps<{ message?: string; onRetry?: boolean }>()
defineEmits<{ retry: [] }>()
</script>
