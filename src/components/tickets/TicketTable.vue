<template>
  <div>
    <!-- Loading skeletons — matched to table shape -->
    <div v-if="loading" class="overflow-x-auto">
      <table class="w-full min-w-[860px] text-sm">
        <thead>
          <tr class="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
            <th class="px-4 py-3">Ticket</th>
            <th class="px-4 py-3">Project</th>
            <th class="px-4 py-3">Severity</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Reporter</th>
            <th class="px-4 py-3">Created</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          <SkeletonTicketRow v-for="i in 7" :key="i" />
        </tbody>
      </table>
    </div>

    <!-- Error -->
    <ErrorState v-else-if="error" :message="error" :on-retry="true" @retry="$emit('retry')" />

    <!-- Empty -->
    <EmptyState v-else-if="!tickets.length" :icon="hasFilters ? 'search' : 'inbox'"
      :title="hasFilters ? 'No tickets match your filters' : 'No tickets yet'"
      :body="hasFilters ? 'Try clearing your filters to see more results.' : 'When bugs are reported they\'ll appear here.'">
      <template #action>
        <AppButton v-if="hasFilters" variant="secondary" @click="$emit('clearFilters')">Clear filters</AppButton>
        <RouterLink v-else to="/tickets/create"><AppButton icon="plus">Create first ticket</AppButton></RouterLink>
      </template>
    </EmptyState>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[860px] text-sm border-separate border-spacing-x-0 border-spacing-y-0">
        <thead>
          <tr class="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <th class="px-5 pb-2 pt-4 font-semibold">Ticket</th>
            <th class="px-3 pb-2 pt-4 font-semibold">Project</th>
            <th class="px-3 pb-2 pt-4 font-semibold">Severity</th>
            <th class="px-3 pb-2 pt-4 font-semibold">Status</th>
            <th class="px-3 pb-2 pt-4 font-semibold">Reporter</th>
            <th class="px-3 pb-2 pt-4 font-semibold">Created</th>
            <th class="px-4 pb-2 pt-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="[&>tr]:transition-all [&>tr]:duration-150">
          <tr v-for="(t, i) in tickets" :key="t.id"
            @click="$emit('rowClick', t)"
            class="group cursor-pointer smooth-fade-up hover:[&>td]:bg-slate-50 dark:hover:[&>td]:bg-slate-800/50"
            :style="{ animationDelay: `${Math.min(i * 25, 180)}ms` }">
            <td class="px-5 py-2.5 max-w-[320px] rounded-l-xl first:pl-5 transition-colors">
              <div class="flex items-center gap-2.5">
                <AppIcon v-if="t.images.length" name="image" :size="14" class="text-slate-300 dark:text-slate-600 shrink-0" />
                <div class="min-w-0">
                  <div class="font-medium text-slate-800 dark:text-slate-100 truncate group-hover:text-brand transition-colors">{{ t.title }}</div>
                  <div class="font-mono text-[10.5px] text-slate-400 mt-px">{{ t.id.slice(0, 16) }}…</div>
                </div>
              </div>
            </td>
            <td class="px-3 py-2.5 transition-colors"><ProjectChip :project-id="t.projectId" /></td>
            <td class="px-3 py-2.5 transition-colors"><SeverityBadge :severity="t.severity" /></td>
            <td class="px-3 py-2.5 transition-colors"><StatusBadge :status="t.status" /></td>
            <td class="px-3 py-2.5 transition-colors">
              <span class="flex items-center gap-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                <AvatarComp :name="t.reporterName" :size="24" />
                <span class="hidden xl:inline text-[13px]">{{ t.reporterName }}</span>
              </span>
            </td>
            <td class="px-3 py-2.5 text-slate-400 whitespace-nowrap text-[13px] tabular-nums transition-colors">{{ fmtDate(t.createdAt) }}</td>
            <td class="px-4 py-2.5 text-right rounded-r-xl transition-colors">
              <span class="inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <RouterLink :to="'/tickets/' + t.id" @click.stop>
                  <button class="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center">
                    <AppIcon name="externalLink" :size="14" />
                  </button>
                </RouterLink>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppIcon           from '@/components/ui/AppIcon.vue'
import AppButton         from '@/components/ui/AppButton.vue'
import SkeletonTicketRow from '@/components/ui/SkeletonTicketRow.vue'
import EmptyState        from '@/components/ui/EmptyState.vue'
import ErrorState   from '@/components/ui/ErrorState.vue'
import SeverityBadge from '@/components/ui/SeverityBadge.vue'
import StatusBadge   from '@/components/ui/StatusBadge.vue'
import AvatarComp   from '@/components/ui/AvatarComp.vue'
import ProjectChip  from '@/components/ui/ProjectChip.vue'
import type { Ticket } from '@/types'

defineProps<{ tickets: Ticket[]; loading?: boolean; error?: string | null; hasFilters?: boolean }>()
defineEmits<{ rowClick: [t: Ticket]; retry: []; clearFilters: [] }>()

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>
