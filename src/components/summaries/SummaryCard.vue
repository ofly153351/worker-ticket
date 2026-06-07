<template>
  <AppCard :pad="false" class="overflow-hidden">
    <!-- Header band -->
    <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/40">
      <div class="flex items-center gap-3 min-w-0">
        <span class="w-10 h-10 rounded-xl bg-brand text-brand-fg flex items-center justify-center shrink-0">
          <AppIcon name="sparkle" :size="20" />
        </span>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-slate-800 dark:text-white truncate">{{ project?.name }}</h3>
            <span class="inline-flex items-center justify-center rounded text-white text-[9px] font-bold shrink-0"
              :style="{ width: '18px', height: '18px', background: project?.color }">{{ project?.code }}</span>
          </div>
          <div class="text-[12px] text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
            <AppIcon name="calendar" :size="12" /> {{ fmtDate(summary.date) }}
          </div>
        </div>
      </div>
      <div class="text-right shrink-0">
        <div class="text-2xl font-bold text-slate-800 dark:text-white tabular-nums">{{ summary.total }}</div>
        <div class="text-[11px] text-slate-400 font-medium">tickets</div>
      </div>
    </div>

    <div class="p-6 space-y-5">
      <!-- Count pills -->
      <div class="flex flex-wrap gap-2">
        <span v-for="k in ORDER" :key="k"
          class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
          :style="{ background: 'color-mix(in srgb,' + SEVERITY_META[k as Severity].dot + ' 12%, transparent)' }">
          <span class="w-2 h-2 rounded-full" :style="{ background: SEVERITY_META[k as Severity].dot }" />
          <span class="text-[12px] font-semibold" :style="{ color: SEVERITY_META[k as Severity].dot }">{{ SEVERITY_META[k as Severity].label }}</span>
          <span class="text-[13px] font-bold text-slate-700 dark:text-slate-200 tabular-nums ml-0.5">{{ summary.counts[k as Severity] }}</span>
        </span>
      </div>
      <SeverityBar :counts="summary.counts" :height="6" />

      <!-- Executive summary -->
      <div>
        <h4 class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Executive summary</h4>
        <p class="text-[13.5px] text-slate-600 dark:text-slate-300 leading-relaxed">{{ summary.executive }}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <h4 class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <AppIcon name="refresh" :size="13" /> Repeated issues
          </h4>
          <ul class="space-y-1.5">
            <li v-for="(r, i) in summary.repeated" :key="i" class="flex items-start gap-2 text-[13px] text-slate-600 dark:text-slate-300">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />{{ r }}
            </li>
          </ul>
        </div>
        <div>
          <h4 class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <AppIcon name="list" :size="13" /> Suggested fix order
          </h4>
          <ol class="space-y-1.5">
            <li v-for="(r, i) in summary.fixOrder" :key="i" class="flex items-start gap-2.5 text-[13px] text-slate-600 dark:text-slate-300">
              <span class="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-px">{{ i + 1 }}</span>{{ r }}
            </li>
          </ol>
        </div>
      </div>

      <!-- Action items -->
      <div>
        <h4 class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <AppIcon name="check" :size="13" /> Action items
        </h4>
        <div class="space-y-1.5">
          <button v-for="(a, i) in localActions" :key="i" @click="toggleAction(i)"
            class="w-full flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left transition-colors">
            <span :class="['w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
              a.done ? 'bg-brand border-brand text-brand-fg' : 'border-slate-300 dark:border-slate-600']">
              <AppIcon v-if="a.done" name="check" :size="13" :stroke-width="3" />
            </span>
            <span :class="['flex-1 text-[13px]', a.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200']">{{ a.text }}</span>
            <span class="flex items-center gap-1.5 text-[12px] text-slate-400 shrink-0 whitespace-nowrap">
              <AvatarComp :name="a.owner" :size="20" />
              <span class="hidden sm:inline">{{ a.owner }}</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </AppCard>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AppCard     from '@/components/ui/AppCard.vue'
import AppIcon     from '@/components/ui/AppIcon.vue'
import AvatarComp  from '@/components/ui/AvatarComp.vue'
import SeverityBar from '@/components/ui/SeverityBar.vue'
import { useProjectStore } from '@/stores/project.store'
import { SEVERITY_META } from '@/constants'
import type { DailySummary, Severity } from '@/types'

const props = defineProps<{ summary: DailySummary }>()
const projectStore = useProjectStore()
const project = computed(() => projectStore.getById(props.summary.projectId))

const ORDER = ['critical', 'high', 'medium', 'low']
const localActions = ref(props.summary.actions.map(a => ({ ...a })))
function toggleAction(i: number) { localActions.value[i].done = !localActions.value[i].done }

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}
</script>
