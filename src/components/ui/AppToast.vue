<template>
  <Teleport to="body">
    <div class="fixed bottom-5 right-5 z-[200] flex flex-col gap-2.5 w-[340px] max-w-[calc(100vw-2.5rem)]">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="flex items-start gap-3 bg-white dark:bg-slate-800 border-round shadow-lg p-3.5 animate-toastIn"
        >
          <span :class="['mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0',
            t.type === 'error'
              ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
              : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400']">
            <AppIcon :name="t.type === 'error' ? 'alert' : 'check'" :size="16" :stroke-width="2.4" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">{{ t.title }}</p>
            <p v-if="t.body" class="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">{{ t.body }}</p>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import AppIcon       from './AppIcon.vue'
import { useToast }  from '@/composables/useToast'

const { toasts } = useToast()
</script>

<style scoped>
.toast-enter-active { animation: toastIn 0.2s ease; }
.toast-leave-active { transition: opacity 0.2s, transform 0.2s; }
.toast-leave-to     { opacity: 0; transform: translateY(6px) scale(.97); }
</style>
