<template>
  <div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 overflow-hidden">
    <!-- top row: name + countdown -->
    <div class="flex items-center justify-between gap-3 px-4 py-3">
      <div class="flex items-center gap-3 min-w-0">
        <span class="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
          <AppIcon name="clock" :size="16" />
        </span>
        <div class="min-w-0">
          <div class="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate">{{ run.name }}</div>
          <div class="text-[11px] text-slate-400">{{ targetLabel }}</div>
        </div>
      </div>
      <div class="text-right shrink-0">
        <div :class="['font-mono font-bold tabular-nums text-[16px] leading-tight transition-colors',
          expired ? 'text-emerald-500 animate-pulse' : 'text-brand']">
          {{ expired ? 'sending…' : clock }}
        </div>
        <div class="text-[10px] text-slate-400 mt-0.5">until next run</div>
      </div>
    </div>

    <!-- config chips + configure link -->
    <div class="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
      <div class="flex items-center gap-1.5 flex-wrap min-w-0">
        <span class="inline-flex items-center gap-1 text-[10.5px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-md">
          <AppIcon name="sparkle" :size="10" class="text-brand" />{{ run.profile }}
        </span>
        <span class="text-[10.5px] font-mono text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-md">
          {{ run.cronExpr }}
        </span>
        <span class="text-[10.5px] font-semibold text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-md">
          open + in&nbsp;progress
        </span>
        <span :class="['inline-flex items-center gap-1 text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md border',
          run.discordConfigured
            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900'
            : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900']">
          💬 {{ run.discordConfigured ? 'Discord set' : 'global webhook' }}
        </span>
      </div>
      <RouterLink :to="{ path: '/projects', query: { edit: run.projectId } }"
        class="shrink-0 text-[11px] font-semibold text-brand hover:underline flex items-center gap-0.5">
        Configure <AppIcon name="arrowRight" :size="11" />
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useCountdown } from '@/composables/useCountdown'
import type { NextRun } from '@/services/config.api'

const props = defineProps<{ run: NextRun }>()

const { clock, expired } = useCountdown(() => props.run.nextRun)

const targetLabel = computed(() => {
  if (!props.run.nextRun) return 'not scheduled'
  return new Date(props.run.nextRun).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    timeZone: props.run.timezone,
  }) + ` · ${props.run.timezone}`
})
</script>
