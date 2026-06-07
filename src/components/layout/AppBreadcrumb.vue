<template>
  <nav class="flex items-center gap-1.5 text-[13px] min-w-0">
    <template v-for="(crumb, i) in crumbs" :key="i">
      <AppIcon v-if="i > 0" name="chevronRight" :size="13" class="text-slate-300 dark:text-slate-600 shrink-0" />
      <RouterLink v-if="crumb.to && i < crumbs.length - 1" :to="crumb.to"
        class="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 truncate">
        {{ crumb.label }}
      </RouterLink>
      <span v-else :class="['truncate', i === crumbs.length - 1 ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400']">
        {{ crumb.label }}
      </span>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'

const route = useRoute()

const crumbs = computed(() => {
  const name = route.name as string
  const base = [{ label: 'Hermes', to: '/dashboard' }]
  if (name === 'dashboard')     return [...base, { label: 'Dashboard' }]
  if (name === 'projects')      return [...base, { label: 'Projects' }]
  if (name === 'tickets')       return [...base, { label: 'Tickets' }]
  if (name === 'create-ticket') return [...base, { label: 'Tickets', to: '/tickets' }, { label: 'New Ticket' }]
  if (name === 'ticket-detail') return [...base, { label: 'Tickets', to: '/tickets' }, { label: route.params.id as string }]
  if (name === 'summaries')     return [...base, { label: 'Daily Summary' }]
  if (name === 'settings')      return [...base, { label: 'Settings' }]
  return base
})
</script>
