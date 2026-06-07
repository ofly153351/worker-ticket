<template>
  <button
    v-bind="$attrs"
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center font-semibold rounded-btn transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
      sizes[size],
      variants[variant],
      className,
    ]"
  >
    <AppSpinner v-if="loading" :size="size === 'sm' ? 14 : 16" class="mr-1" />
    <AppIcon v-else-if="icon" :name="icon" :size="size === 'sm' ? 15 : 17" />
    <slot />
    <AppIcon v-if="iconRight" :name="iconRight" :size="size === 'sm' ? 15 : 17" />
  </button>
</template>

<script setup lang="ts">
import AppIcon    from './AppIcon.vue'
import AppSpinner from './AppSpinner.vue'

withDefaults(defineProps<{
  variant?:  'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
  size?:     'sm' | 'md' | 'lg'
  icon?:     string
  iconRight?: string
  loading?:  boolean
  disabled?: boolean
  type?:     'button' | 'submit' | 'reset'
  className?: string
}>(), { variant: 'primary', size: 'md', type: 'button' })

const sizes = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
}
const variants = {
  primary:   'bg-brand text-white hover:bg-brand-hover shadow-sm',
  secondary: 'bg-white text-slate-700 border-round-sm hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80',
  ghost:     'text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
  danger:    'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
  subtle:    'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80',
}
</script>
