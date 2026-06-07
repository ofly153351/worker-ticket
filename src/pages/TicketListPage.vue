<template>
  <div class="smooth-fade-up space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Tickets</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          {{ ticketStore.tickets.length }} bugs reported across {{ projectStore.projects.length }} projects.
        </p>
      </div>
      <RouterLink to="/tickets/create"><AppButton icon="plus">Create Ticket</AppButton></RouterLink>
    </div>

    <AppCard :pad="false">
      <!-- Toolbar -->
      <div class="p-3 flex flex-col lg:flex-row lg:items-center gap-3 border-b border-slate-100 dark:border-slate-800">
        <div class="relative flex-1 min-w-0">
          <AppIcon name="search" :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input v-model="q" @input="onSearch" placeholder="Search by title, description or ID…"
            class="w-full h-9 pl-9 pr-3 rounded-btn bg-slate-100 dark:bg-slate-800 border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-brand text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none transition-colors" />
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <AppIcon name="filter" :size="15" class="text-slate-400 hidden sm:block" />
          <select v-model="projectId" class="filter-select" @change="applyFilters">
            <option value="">All projects</option>
            <option v-for="p in projectStore.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <select v-model="severity" class="filter-select" @change="applyFilters">
            <option value="">All severity</option>
            <option v-for="s in SEVERITIES" :key="s" :value="s">{{ SEVERITY_META[s].label }}</option>
          </select>
          <select v-model="status" class="filter-select" @change="applyFilters">
            <option value="">All status</option>
            <option v-for="s in TICKET_STATUSES" :key="s" :value="s">{{ STATUS_META[s].label }}</option>
          </select>
          <button v-if="hasFilters" @click="clearFilters"
            class="text-[13px] font-semibold text-slate-400 hover:text-rose-500 px-2 flex items-center gap-1">
            <AppIcon name="x" :size="14" />Clear
          </button>

          <!-- View toggle -->
          <div class="flex items-center rounded-btn border border-slate-200 dark:border-slate-700 overflow-hidden ml-1">
            <button @click="view = 'table'" :class="['px-2.5 h-9 flex items-center gap-1.5 text-[12px] font-semibold transition-colors',
              view === 'table' ? 'bg-brand text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800']">
              <AppIcon name="list" :size="14" />
              <span class="hidden sm:inline">Table</span>
            </button>
            <button @click="view = 'calendar'" :class="['px-2.5 h-9 flex items-center gap-1.5 text-[12px] font-semibold transition-colors border-l border-slate-200 dark:border-slate-700',
              view === 'calendar' ? 'bg-brand text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800']">
              <AppIcon name="calendar" :size="14" />
              <span class="hidden sm:inline">Calendar</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Table view -->
      <template v-if="view === 'table'">
        <div v-if="!ticketStore.loading" class="px-4 py-2.5 text-[12px] text-slate-400 border-b border-slate-100 dark:border-slate-800">
          Showing <span class="font-semibold text-slate-600 dark:text-slate-300">{{ ticketStore.filteredTickets.length }}</span> ticket{{ ticketStore.filteredTickets.length === 1 ? '' : 's' }}{{ hasFilters ? ' (filtered)' : '' }}
        </div>
        <TicketTable
          :tickets="ticketStore.filteredTickets"
          :loading="ticketStore.loading"
          :error="ticketStore.error"
          :has-filters="hasFilters"
          @row-click="t => router.push('/tickets/' + t.id)"
          @retry="ticketStore.fetchAll()"
          @clear-filters="clearFilters"
        />
      </template>

      <!-- Calendar view -->
      <TicketCalendar
        v-else
        :tickets="ticketStore.filteredTickets"
        :loading="ticketStore.loading"
        @ticket-click="t => router.push('/tickets/' + t.id)"
      />
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useTicketStore }  from '@/stores/ticket.store'
import { useProjectStore } from '@/stores/project.store'
import { SEVERITY_META, SEVERITIES, STATUS_META, TICKET_STATUSES } from '@/constants'
import AppButton    from '@/components/ui/AppButton.vue'
import AppCard      from '@/components/ui/AppCard.vue'
import AppIcon      from '@/components/ui/AppIcon.vue'
import TicketTable    from '@/components/tickets/TicketTable.vue'
import TicketCalendar from '@/components/tickets/TicketCalendar.vue'
import type { Severity, TicketStatus } from '@/types'

const ticketStore  = useTicketStore()
const projectStore = useProjectStore()
const router = useRouter()
const route  = useRoute()

const view = ref<'table' | 'calendar'>('calendar')

const q         = ref((route.query.q as string) || '')
const projectId = ref((route.query.projectId as string) || '')
const severity  = ref((route.query.severity  as Severity | '') || '')
const status    = ref((route.query.status    as TicketStatus | '') || '')

const hasFilters = computed(() => !!(q.value || projectId.value || severity.value || status.value))

let searchTimeout: ReturnType<typeof setTimeout>
function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(applyFilters, 300)
}

function applyFilters() {
  ticketStore.filters = {
    q: q.value || undefined,
    projectId: projectId.value || undefined,
    severity: severity.value || undefined,
    status: status.value || undefined,
  }
}

function clearFilters() {
  q.value = ''; projectId.value = ''; severity.value = ''; status.value = ''
  ticketStore.filters = {}
}

onMounted(async () => {
  await Promise.all([ticketStore.fetchAll(), projectStore.fetch()])
  applyFilters()
})
</script>

<style scoped>
.filter-select {
  @apply appearance-none h-9 pl-3 pr-7 rounded-btn border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-brand cursor-pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
}
</style>
