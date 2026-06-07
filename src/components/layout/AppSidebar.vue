<template>
  <Transition name="overlay">
    <div v-if="open" class="fixed inset-0 bg-slate-900/40 z-40 lg:hidden" @click="$emit('close')" />
  </Transition>

  <aside :class="[
    'fixed lg:static z-50 top-0 left-0 h-full w-[248px] shrink-0',
    'bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800',
    'flex flex-col transition-transform duration-200',
    open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
  ]">
    <!-- Brand -->
    <div class="h-16 flex items-center gap-2.5 px-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
      <span class="w-9 h-9 rounded-xl bg-brand text-brand-fg flex items-center justify-center shrink-0">
        <AppIcon name="bug" :size="20" :stroke-width="2" />
      </span>
      <div class="leading-tight">
        <div class="font-bold text-slate-800 dark:text-white tracking-tight">Hermes</div>
        <div class="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Bug Tracker</div>
      </div>
    </div>

    <!-- Nav -->
    <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      <div class="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Workspace</div>
      <RouterLink
        v-for="item in NAV_ITEMS"
        :key="item.name"
        :to="item.to"
        custom
        v-slot="{ navigate, isActive: linkActive }"
      >
        <button
          @click="() => { navigate(); $emit('close') }"
          :class="[
            'w-full flex items-center gap-3 px-3 h-10 rounded-btn text-sm font-medium transition-colors',
            isItemActive(item.name)
              ? 'bg-brand text-brand-fg'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
          ]"
        >
          <AppIcon :name="item.icon" :size="19" :stroke-width="isItemActive(item.name) ? 2 : 1.75" />
          <span class="flex-1 text-left">{{ item.label }}</span>
          <span v-if="item.name === 'tickets' && openCount > 0"
            :class="['text-[11px] font-bold px-1.5 py-0.5 rounded-full',
              isItemActive(item.name)
                ? 'bg-white/20'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200']">
            {{ openCount }}
          </span>
        </button>
      </RouterLink>
    </nav>

    <!-- Hermes agent card -->
    <div class="p-3 shrink-0">
      <div class="border-round-lg bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 p-3.5">
        <div class="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <AppIcon name="sparkle" :size="16" />
          <span class="text-[13px] font-semibold">Hermes Agent</span>
        </div>
        <p class="text-[12px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
          Daily digest at 06:00 · all active projects.
        </p>
        <RouterLink to="/summaries" @click="$emit('close')"
          class="mt-2.5 text-[12px] font-semibold text-brand hover:underline flex items-center gap-1">
          View summary <AppIcon name="arrowRight" :size="13" />
        </RouterLink>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useTicketStore } from '@/stores/ticket.store'
import AppIcon from '@/components/ui/AppIcon.vue'

defineProps<{ open: boolean }>()
defineEmits<{ close: [] }>()

const route       = useRoute()
const ticketStore = useTicketStore()

const NAV_ITEMS = [
  { name: 'dashboard', label: 'Dashboard',    icon: 'dashboard', to: '/dashboard'  },
  { name: 'projects',  label: 'Projects',      icon: 'projects',  to: '/projects'   },
  { name: 'tickets',   label: 'Tickets',       icon: 'tickets',   to: '/tickets'    },
  { name: 'summaries', label: 'Daily Summary', icon: 'summary',   to: '/summaries'  },
  { name: 'settings',  label: 'Agents',        icon: 'agent',     to: '/settings'   },
]

const TICKET_ROUTES = new Set(['tickets', 'create-ticket', 'ticket-detail'])

function isItemActive(name: string) {
  const rn = route.name as string
  if (name === 'tickets') return TICKET_ROUTES.has(rn)
  return rn === name
}

const openCount = computed(() => ticketStore.tickets.filter(t => t.status === 'open').length)
</script>

<style scoped>
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.2s; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }
</style>
