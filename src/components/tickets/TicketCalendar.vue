<template>
  <div class="select-none">

    <!-- Month nav -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
      <button @click="prevMonth" class="w-8 h-8 rounded-btn hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors">
        <AppIcon name="arrowLeft" :size="16" />
      </button>
      <div class="text-center">
        <div class="text-[15px] font-bold text-slate-800 dark:text-white">{{ monthLabel }}</div>
        <div class="text-[11px] text-slate-400 mt-px">{{ ticketsThisMonth.length }} ticket{{ ticketsThisMonth.length !== 1 ? 's' : '' }} this month</div>
      </div>
      <button @click="nextMonth" class="w-8 h-8 rounded-btn hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors">
        <AppIcon name="arrowRight" :size="16" />
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-6">
      <div class="grid grid-cols-7 gap-1 mb-2">
        <div v-for="d in DAY_NAMES" :key="d" class="text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 py-1">{{ d }}</div>
      </div>
      <div class="grid grid-cols-7 gap-1">
        <div v-for="i in 35" :key="i" class="h-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/60" />
      </div>
    </div>

    <!-- Calendar grid -->
    <div v-else class="p-3">
      <!-- Day headers -->
      <div class="grid grid-cols-7 mb-1">
        <div v-for="d in DAY_NAMES" :key="d"
          class="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 py-2">
          {{ d }}
        </div>
      </div>

      <!-- Weeks -->
      <div class="grid grid-cols-7 gap-1">
        <div v-for="day in calendarDays" :key="day.iso"
          :class="['relative min-h-[140px] rounded-xl p-2 transition-colors group',
            day.isCurrentMonth ? 'bg-white dark:bg-slate-900/50' : 'bg-slate-50/50 dark:bg-slate-800/20',
            day.isToday ? 'ring-2 ring-brand ring-offset-1 dark:ring-offset-slate-950' : '',
            day.tickets.length > 0 ? 'hover:bg-slate-50 dark:hover:bg-slate-800/60' : '']">

          <!-- Day number -->
          <div :class="['w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold mb-1.5 mx-auto',
            day.isToday ? 'bg-brand text-white' : day.isCurrentMonth ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600']">
            {{ day.num }}
          </div>

          <!-- Ticket cards -->
          <div class="space-y-0.5">
            <button v-for="ticket in day.visible" :key="ticket.id"
              @click="$emit('ticketClick', ticket)"
              class="w-full text-left rounded-md px-2 py-1.5 text-[12px] font-medium leading-tight transition-all hover:opacity-80 active:scale-95 flex items-center gap-1 min-w-0"
              :class="ticket.status === 'rejected' ? 'opacity-40' : ticket.status === 'resolved' ? 'opacity-70' : ''"
              :style="{
                background: (ticket.status === 'resolved' || ticket.status === 'rejected')
                  ? (isDark ? '#1e293b' : '#f1f5f9')
                  : severityBg(ticket.severity),
                color: (ticket.status === 'resolved' || ticket.status === 'rejected')
                  ? (isDark ? '#64748b' : '#94a3b8')
                  : severityText(ticket.severity),
                borderLeft: `2px solid ${
                  ticket.status === 'resolved' ? '#22c55e'
                  : ticket.status === 'rejected' ? '#94a3b8'
                  : severityDot(ticket.severity)
                }`
              }">
              <span class="truncate flex-1" :class="(ticket.status === 'resolved' || ticket.status === 'rejected') ? 'line-through' : ''">
                {{ ticket.title }}
              </span>
              <span v-if="ticket.status === 'resolved'" class="text-emerald-500 shrink-0 text-[10px]">✓</span>
              <span v-else-if="ticket.status === 'rejected'" class="shrink-0 text-[10px] text-slate-400">✕</span>
            </button>

            <!-- +N more -->
            <button v-if="day.overflow > 0"
              @click="openDayDetail(day)"
              class="w-full text-left px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-brand transition-colors">
              +{{ day.overflow }} more
            </button>
          </div>

          <!-- Empty day hint on hover -->
          <div v-if="day.tickets.length === 0 && day.isCurrentMonth"
            class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <span class="text-[10px] text-slate-300 dark:text-slate-700">no tickets</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Day detail popover -->
    <Teleport to="body">
      <Transition name="modal-backdrop">
        <div v-if="selectedDay"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          @click.self="selectedDay = null">
          <Transition name="modal-panel" appear>
            <div v-if="selectedDay"
              class="w-full max-w-sm bg-white dark:bg-slate-900 border-round-lg shadow-2xl overflow-hidden max-h-[80dvh] flex flex-col">
              <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div class="text-[13px] font-bold text-slate-800 dark:text-white">{{ selectedDayLabel }}</div>
                  <div class="text-[11px] text-slate-400">{{ selectedDay.tickets.length }} ticket{{ selectedDay.tickets.length !== 1 ? 's' : '' }}</div>
                </div>
                <button @click="selectedDay = null"
                  class="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400">
                  <AppIcon name="x" :size="15" />
                </button>
              </div>
              <div class="overflow-y-auto p-3 space-y-2">
                <button v-for="t in selectedDay.tickets" :key="t.id"
                  @click="$emit('ticketClick', t); selectedDay = null"
                  class="w-full flex items-start gap-2.5 text-left rounded-xl p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                  <span class="w-1 h-full rounded-full shrink-0 mt-1" :style="{ background: severityDot(t.severity), minHeight: '36px', width: '3px' }" />
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5">
                      <span class="text-[13px] font-semibold text-slate-800 dark:text-slate-100 group-hover:text-brand transition-colors truncate"
                        :class="(t.status === 'resolved' || t.status === 'rejected') ? 'line-through opacity-60' : ''">
                        {{ t.title }}
                      </span>
                      <span v-if="t.status === 'resolved'" class="text-emerald-500 text-[12px] shrink-0">✓</span>
                      <span v-else-if="t.status === 'rejected'" class="text-slate-400 text-[12px] shrink-0">✕</span>
                    </div>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="text-[11px] font-medium" :style="{ color: severityDot(t.severity) }">{{ SEVERITY_META[t.severity]?.label }}</span>
                      <span class="text-[11px] text-slate-400">·</span>
                      <span class="text-[11px]"
                        :class="t.status === 'resolved' ? 'text-emerald-500 font-semibold' : t.status === 'rejected' ? 'text-slate-400' : 'text-slate-400'">
                        {{ t.status.replace('_', ' ') }}
                      </span>
                    </div>
                  </div>
                  <AppIcon name="arrowRight" :size="14" class="text-slate-300 dark:text-slate-600 group-hover:text-brand shrink-0 mt-1 transition-colors" />
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { SEVERITY_META } from '@/constants'
import { useTheme } from '@/composables/useTheme'
import type { Ticket, Severity } from '@/types'

const props = defineProps<{ tickets: Ticket[]; loading?: boolean }>()
defineEmits<{ ticketClick: [t: Ticket] }>()

const { isDark } = useTheme()

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_PER_DAY = 4

/* ── navigation ─────────────────────────────────────────────────── */
const today = new Date()
const cursor = ref(new Date(today.getFullYear(), today.getMonth(), 1))

function prevMonth() { cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() - 1, 1) }
function nextMonth() { cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + 1, 1) }

const monthLabel = computed(() =>
  cursor.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
)

/* ── ticket grouping ─────────────────────────────────────────────── */
const ticketsByDate = computed(() => {
  const map = new Map<string, Ticket[]>()
  for (const t of props.tickets) {
    const key = new Date(t.createdAt).toLocaleDateString('sv-SE') // YYYY-MM-DD
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(t)
  }
  return map
})

const ticketsThisMonth = computed(() => {
  const y = cursor.value.getFullYear(), m = cursor.value.getMonth()
  return props.tickets.filter(t => {
    const d = new Date(t.createdAt)
    return d.getFullYear() === y && d.getMonth() === m
  })
})

/* ── calendar days ───────────────────────────────────────────────── */
interface CalDay {
  iso: string; num: number; isCurrentMonth: boolean; isToday: boolean
  tickets: Ticket[]; visible: Ticket[]; overflow: number
}

const calendarDays = computed((): CalDay[] => {
  const y = cursor.value.getFullYear()
  const m = cursor.value.getMonth()
  const firstDay = new Date(y, m, 1)
  const lastDay  = new Date(y, m + 1, 0)

  // ISO week: Monday = 0 … Sunday = 6
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const days: CalDay[] = []

  // Prev month fill
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(y, m, -i)
    days.push(makeDay(d, false))
  }

  // Current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(makeDay(new Date(y, m, i), true))
  }

  // Next month fill (complete to 6 rows = 42 cells)
  const remainder = 42 - days.length
  for (let i = 1; i <= remainder; i++) {
    days.push(makeDay(new Date(y, m + 1, i), false))
  }

  return days
})

function makeDay(d: Date, isCurrentMonth: boolean): CalDay {
  const iso = d.toLocaleDateString('sv-SE')
  const tickets = (ticketsByDate.value.get(iso) ?? [])
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity))
  const isToday = iso === today.toLocaleDateString('sv-SE')
  return {
    iso, num: d.getDate(), isCurrentMonth, isToday,
    tickets,
    visible: tickets.slice(0, MAX_PER_DAY),
    overflow: Math.max(0, tickets.length - MAX_PER_DAY),
  }
}

const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low']

/* ── severity colors ─────────────────────────────────────────────── */
function severityDot(s: Severity): string { return SEVERITY_META[s]?.dot ?? '#94a3b8' }
function severityBg(s: Severity): string {
  return isDark.value ? SEVERITY_META[s]?.bgDark ?? '#1e293b' : SEVERITY_META[s]?.bg ?? '#f1f5f9'
}
function severityText(s: Severity): string {
  return isDark.value ? SEVERITY_META[s]?.textDark ?? '#cbd5e1' : SEVERITY_META[s]?.text ?? '#475569'
}

/* ── day detail popover ──────────────────────────────────────────── */
const selectedDay = ref<CalDay | null>(null)

function openDayDetail(day: CalDay) { selectedDay.value = day }

const selectedDayLabel = computed(() => {
  if (!selectedDay.value) return ''
  return new Date(selectedDay.value.iso + 'T00:00:00')
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
})
</script>

<style scoped>
.modal-backdrop-enter-active, .modal-backdrop-leave-active { transition: opacity 0.2s ease; }
.modal-backdrop-enter-from,  .modal-backdrop-leave-to     { opacity: 0; }
.modal-panel-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.modal-panel-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.modal-panel-enter-from   { opacity: 0; transform: scale(0.96) translateY(8px); }
.modal-panel-leave-to     { opacity: 0; transform: scale(0.97); }
</style>
