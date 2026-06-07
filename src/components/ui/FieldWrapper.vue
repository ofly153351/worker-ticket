<template>
  <div class="space-y-1.5">
    <div class="flex items-baseline justify-between gap-2 flex-wrap">
      <label v-if="label" :for="inputId" class="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
        {{ label }}<span v-if="required" class="text-rose-500 ml-0.5">*</span>
      </label>
      <span v-if="hint" class="text-[12px] text-slate-400 shrink-0">{{ hint }}</span>
    </div>
    <slot />
    <p v-if="error" class="text-[12px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
      <AppIcon name="alert" :size="13" />{{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import AppIcon from './AppIcon.vue'
defineProps<{ label?: string; inputId?: string; required?: boolean; hint?: string; error?: string }>()
</script>
