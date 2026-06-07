<template>
  <div class="smooth-fade-up space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Good morning 👋</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1 text-sm">{{ todayLabel }}</p>
      </div>
      <RouterLink to="/tickets/create"><AppButton icon="plus">New Ticket</AppButton></RouterLink>
    </div>

    <!-- Stat cards — skeleton matches exact card shape -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <SkeletonStatCard v-if="ticketStore.loading && !ticketStore.tickets.length" v-for="i in 4" :key="'sk-' + i" />
      <AppCard v-else v-for="(c, i) in statCards" :key="c.label"
        class="smooth-fade-up" :style="{ animationDelay: `${i * 40}ms` }">
        <div class="flex items-start justify-between">
          <span :class="['w-10 h-10 rounded-xl flex items-center justify-center', c.iconClass]">
            <AppIcon :name="c.icon" :size="20" />
          </span>
          <span v-if="c.sub" class="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <AppIcon name="trendUp" :size="13" />{{ c.sub }}
          </span>
        </div>
        <div class="mt-4">
          <AppSkeleton v-if="ticketStore.loading" class-name="h-8 w-16" />
          <div v-else class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">{{ c.value }}</div>
          <div class="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-medium">{{ c.label }}</div>
        </div>
      </AppCard>
    </div>

    <!-- Charts row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Latest AI digest -->
      <AppCard class="flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <AppIcon name="sparkle" :size="16" class="text-brand" /> Latest AI summary
          </h3>
          <span class="text-[11px] font-semibold text-slate-400">Today 06:00</span>
        </div>
        <template v-if="summaryStore.loading">
          <AppSkeleton v-for="i in 4" :key="i" class-name="h-3 w-full mb-2" />
        </template>
        <template v-else-if="latestSummary">
          <ProjectChip :project-id="latestSummary.projectId" class="mb-3" />
          <p class="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed flex-1 line-clamp-5">{{ latestSummary.executive }}</p>
          <SeverityBar :counts="latestSummary.counts" class="mt-4" />
          <RouterLink to="/summaries" class="mt-4 text-[13px] font-semibold text-brand hover:underline flex items-center gap-1 self-start">
            Read full digest <AppIcon name="arrowRight" :size="14" />
          </RouterLink>
        </template>
        <p v-else class="text-[13px] text-slate-400">No summaries yet.</p>
      </AppCard>

      <!-- By severity -->
      <AppCard>
        <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Tickets by severity</h3>
        <div v-if="ticketStore.loading" class="space-y-3">
          <AppSkeleton v-for="i in 4" :key="i" class-name="h-7 w-full" />
        </div>
        <div v-else class="space-y-3">
          <RouterLink v-for="row in bySeverity" :key="row.s" :to="{ path: '/tickets', query: { severity: row.s } }"
            class="flex items-center gap-3 group">
            <span class="w-20 text-[13px] text-slate-600 dark:text-slate-300 truncate group-hover:text-slate-900 dark:group-hover:text-white">{{ row.label }}</span>
            <span class="flex-1 h-7 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden relative">
              <span class="absolute inset-y-0 left-0 rounded-md flex items-center justify-end pr-2"
                :style="{ width: Math.max((row.n / maxSev) * 100, 14) + '%', background: row.dot }">
                <span class="text-[11px] font-bold text-white">{{ row.n }}</span>
              </span>
            </span>
          </RouterLink>
        </div>
      </AppCard>

      <!-- By project -->
      <AppCard>
        <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Tickets by project</h3>
        <div v-if="ticketStore.loading || projectStore.loading" class="space-y-3">
          <AppSkeleton v-for="i in 5" :key="i" class-name="h-7 w-full" />
        </div>
        <div v-else class="space-y-3">
          <RouterLink v-for="row in byProject" :key="row.id" :to="{ path: '/tickets', query: { projectId: row.id } }"
            class="flex items-center gap-3 group">
            <span class="w-28 text-[13px] text-slate-600 dark:text-slate-300 truncate group-hover:text-slate-900 dark:group-hover:text-white">{{ row.name }}</span>
            <span class="flex-1 h-7 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden relative">
              <span class="absolute inset-y-0 left-0 rounded-md flex items-center justify-end pr-2"
                :style="{ width: Math.max((row.n / maxProj) * 100, 14) + '%', background: row.color }">
                <span class="text-[11px] font-bold text-white">{{ row.n }}</span>
              </span>
            </span>
          </RouterLink>
        </div>
      </AppCard>
    </div>

    <!-- Recent tickets -->
    <AppCard :pad="false">
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100">Recent tickets</h3>
        <RouterLink to="/tickets" class="text-[13px] font-semibold text-brand hover:underline flex items-center gap-1">
          View all <AppIcon name="arrowRight" :size="14" />
        </RouterLink>
      </div>
      <div v-if="ticketStore.loading && !ticketStore.tickets.length" class="p-3 space-y-1">
        <div v-for="i in 5" :key="i"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div class="w-2 h-2 rounded-full animate-pulse bg-slate-200 dark:bg-slate-700 shrink-0" />
          <div class="flex-1 h-3.5 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
          <div class="h-5 w-14 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
          <div class="h-3 w-10 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
      <div v-else class="p-3 space-y-0.5">
        <RouterLink v-for="(t, i) in recentTickets" :key="t.id" :to="'/tickets/' + t.id"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-150 group smooth-fade-up"
          :style="{ animationDelay: `${i * 30}ms` }">
          <SeverityBadge :severity="t.severity" dot-only />
          <span class="flex-1 min-w-0 text-[13.5px] text-slate-700 dark:text-slate-200 truncate font-medium group-hover:text-brand transition-colors">{{ t.title }}</span>
          <span class="hidden md:block shrink-0"><ProjectChip :project-id="t.projectId" :show-name="false" /></span>
          <StatusBadge :status="t.status" />
          <span class="text-[12px] text-slate-400 w-14 text-right shrink-0 tabular-nums">{{ relTime(t.createdAt) }}</span>
        </RouterLink>
      </div>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useTicketStore }  from '@/stores/ticket.store'
import { useProjectStore } from '@/stores/project.store'
import { useSummaryStore } from '@/stores/summary.store'
import { SEVERITY_META, SEVERITIES } from '@/constants'
import AppButton        from '@/components/ui/AppButton.vue'
import AppCard          from '@/components/ui/AppCard.vue'
import AppIcon          from '@/components/ui/AppIcon.vue'
import SkeletonStatCard from '@/components/ui/SkeletonStatCard.vue'
import SkeletonTicketRow from '@/components/ui/SkeletonTicketRow.vue'
import SeverityBadge    from '@/components/ui/SeverityBadge.vue'
import StatusBadge      from '@/components/ui/StatusBadge.vue'
import ProjectChip      from '@/components/ui/ProjectChip.vue'
import SeverityBar      from '@/components/ui/SeverityBar.vue'

const ticketStore  = useTicketStore()
const projectStore = useProjectStore()
const summaryStore = useSummaryStore()

onMounted(() => Promise.all([
  ticketStore.fetchAll(),
  projectStore.fetch(),
  summaryStore.fetch(),
]))

const todayLabel = computed(() =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
)

const statCards = computed(() => [
  { icon: 'inbox',    label: 'Total tickets', value: ticketStore.stats.total,    iconClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  { icon: 'tickets',  label: 'Open tickets',  value: ticketStore.stats.open,     iconClass: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400' },
  { icon: 'fire',     label: 'Critical',      value: ticketStore.stats.critical, iconClass: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400' },
  { icon: 'calendar', label: 'New today',     value: ticketStore.stats.today,    iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400', sub: '' },
])

const bySeverity = computed(() =>
  [...SEVERITIES].reverse().map(s => ({
    s, label: SEVERITY_META[s].label, dot: SEVERITY_META[s].dot,
    n: ticketStore.tickets.filter(t => t.severity === s).length,
  }))
)
const maxSev = computed(() => Math.max(...bySeverity.value.map(r => r.n), 1))

const byProject = computed(() =>
  projectStore.projects.map(p => ({
    id: p.id, name: p.name, color: p.color,
    n: ticketStore.tickets.filter(t => t.projectId === p.id).length,
  })).sort((a, b) => b.n - a.n)
)
const maxProj = computed(() => Math.max(...byProject.value.map(r => r.n), 1))

const latestSummary = computed(() => summaryStore.summaries[0] ?? null)
const recentTickets = computed(() =>
  [...ticketStore.tickets].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6)
)

function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  const d = Math.floor(diff / 86400)
  if (d <= 0) { const h = Math.floor(diff / 3600); return h <= 0 ? 'just now' : h + 'h ago' }
  if (d === 1) return 'yesterday'
  if (d < 7) return d + 'd ago'
  return Math.floor(d / 7) + 'w ago'
}
</script>
