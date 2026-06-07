<template>
  <div class="smooth-fade-up space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Projects</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1 text-sm">{{ projectStore.projects.length }} projects connected to Hermes.</p>
      </div>
      <AppButton icon="plus" @click="openCreate">New Project</AppButton>
    </div>

    <ErrorState v-if="projectStore.error" :message="projectStore.error" :on-retry="true" @retry="projectStore.fetch()" />

    <div v-else-if="projectStore.loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      <SkeletonProjectCard v-for="i in 6" :key="i" />
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      <AppCard v-for="(p, i) in projectStore.projects" :key="p.id"
        interactive class="flex flex-col smooth-fade-up"
        :style="{ animationDelay: `${Math.min(i * 50, 250)}ms` }">

        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3 min-w-0">
            <span class="inline-flex items-center justify-center rounded-xl text-white text-sm font-bold shrink-0"
              :style="{ width: '44px', height: '44px', background: p.color }">{{ p.code }}</span>
            <div class="min-w-0">
              <h3 class="font-bold text-slate-800 dark:text-white truncate">{{ p.name }}</h3>
              <span class="text-[12px] text-slate-400 font-mono">{{ p.code }}</span>
            </div>
          </div>
          <span :class="['text-[11px] font-semibold px-2 py-1 rounded-full shrink-0',
            p.status === 'Archived'
              ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400']">
            {{ p.status }}
          </span>
        </div>

        <p class="text-[13px] text-slate-500 dark:text-slate-400 mt-3 leading-relaxed line-clamp-2 flex-1">
          {{ p.description || 'No description.' }}
        </p>

        <div class="grid grid-cols-2 gap-3 mt-4">
          <div class="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5">
            <div class="text-xl font-bold text-slate-800 dark:text-white tabular-nums">{{ projectTickets(p.id) }}</div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total tickets</div>
          </div>
          <div class="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5">
            <div class="text-xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">{{ openTickets(p.id) }}</div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Open</div>
          </div>
        </div>

        <div v-if="projectTickets(p.id) > 0" class="mt-3.5">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[11px] text-slate-400 font-medium">Severity mix</span>
            <span v-if="criticalTickets(p.id) > 0" class="text-[11px] font-semibold text-rose-500 flex items-center gap-1">
              <AppIcon name="fire" :size="12" />{{ criticalTickets(p.id) }} critical
            </span>
          </div>
          <SeverityBar :counts="sevCounts(p.id)" :height="6" />
        </div>

        <!-- Agent + cron badge -->
        <div class="mt-3 flex items-center gap-2 flex-wrap">
          <div class="flex items-center gap-1.5 text-[11px]"
            :class="(p as any).hermesProfile ? 'text-brand font-semibold' : 'text-slate-400'">
            <AppIcon name="sparkle" :size="12" />
            <span class="font-mono">{{ (p as any).hermesProfile || 'default' }}</span>
          </div>
          <span v-if="(p as any).cronEnabled"
            class="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <AppIcon name="clock" :size="10" />
            {{ (p as any).cronExpr || '08:00' }}
          </span>
          <span v-else class="text-[10px] text-slate-400">manual only</span>
        </div>

        <div class="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <RouterLink :to="{ path: '/tickets', query: { projectId: p.id } }" class="flex-1">
            <AppButton variant="secondary" size="sm" icon-right="arrowRight" class="w-full">View tickets</AppButton>
          </RouterLink>
          <AppButton v-if="(p as any).hermesProfile || (p as any).cronEnabled"
            variant="ghost" size="sm" icon="sparkle"
            @click.stop="openPreview(p)"
            title="Preview & run summary" />
          <AppButton v-if="(p as any).hermesProfile || (p as any).cronEnabled"
            variant="ghost" size="sm" icon="refresh"
            :loading="runningId === p.id"
            @click.stop="runSummary(p)"
            title="Run summary now" />
          <AppButton variant="ghost" size="sm" icon="settings" @click.stop="openEdit(p)">Edit</AppButton>
        </div>
      </AppCard>
    </div>

    <!-- Summary preview modal -->
    <SummaryPreviewModal
      v-model="previewOpen"
      :project="previewProject"
      :running="runningId === previewProject?.id"
      @run="previewProject && runSummary(previewProject)"
    />

    <!-- Create / Edit modal -->
    <ProjectModal
      v-model="modalOpen"
      :project="editingProject"
      @saved="onSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project.store'
import { useTicketStore }  from '@/stores/ticket.store'
import { SEVERITIES } from '@/constants'
import AppButton           from '@/components/ui/AppButton.vue'
import AppCard             from '@/components/ui/AppCard.vue'
import AppIcon             from '@/components/ui/AppIcon.vue'
import SkeletonProjectCard from '@/components/ui/SkeletonProjectCard.vue'
import ErrorState          from '@/components/ui/ErrorState.vue'
import SeverityBar         from '@/components/ui/SeverityBar.vue'
import ProjectModal        from '@/components/projects/ProjectModal.vue'
import SummaryPreviewModal from '@/components/projects/SummaryPreviewModal.vue'
import { api } from '@/services/api'
import { useToast } from '@/composables/useToast'
import type { Project, Severity } from '@/types'

const projectStore = useProjectStore()
const ticketStore  = useTicketStore()
const route  = useRoute()
const router = useRouter()

onMounted(async () => {
  await Promise.all([projectStore.fetch(), ticketStore.fetchAll()])
  // Deep-link: /projects?edit=<id> opens that project's modal (from Settings → Configure)
  const editId = route.query.edit as string | undefined
  if (editId) {
    const p = projectStore.projects.find(p => p.id === editId)
    if (p) openEdit(p)
    router.replace({ query: {} })  // clear so refresh doesn't re-open
  }
})

const projectTickets  = (id: string) => ticketStore.tickets.filter(t => t.projectId === id).length
const openTickets     = (id: string) => ticketStore.tickets.filter(t => t.projectId === id && t.status === 'open').length
const criticalTickets = (id: string) => ticketStore.tickets.filter(t => t.projectId === id && t.severity === 'critical').length
const sevCounts = (id: string) =>
  Object.fromEntries(SEVERITIES.map(s => [s, ticketStore.tickets.filter(t => t.projectId === id && t.severity === s).length])) as Record<Severity, number>

// Modal state
const modalOpen      = ref(false)
const editingProject = ref<Project | null>(null)
const runningId      = ref<string | null>(null)
const previewOpen    = ref(false)
const previewProject = ref<Project | null>(null)
const { success: toastOk, error: toastErr } = useToast()

function openCreate() {
  editingProject.value = null
  modalOpen.value = true
}

function openEdit(p: Project) {
  editingProject.value = p
  modalOpen.value = true
}

async function onSaved() {
  await projectStore.fetch()
}

function openPreview(p: Project) {
  previewProject.value = p
  previewOpen.value = true
}

async function runSummary(p: Project) {
  runningId.value = p.id
  try {
    await api.post(`/projects/${p.id}/run-summary`)
    toastOk('Summary started', `${p.name} — agent is analyzing tickets.`)
  } catch {
    toastErr('Failed', 'Could not start summary job.')
  } finally {
    runningId.value = null
  }
}
</script>
