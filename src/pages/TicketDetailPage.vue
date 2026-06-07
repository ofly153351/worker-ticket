<template>
  <div>
    <RouterLink to="/tickets" class="text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 mb-4">
      <AppIcon name="arrowLeft" :size="15" /> Back to tickets
    </RouterLink>

    <!-- Detail skeleton — matches 2-col layout -->
    <div v-if="ticketStore.detailLoading" class="space-y-4" aria-hidden="true">
      <div class="flex items-center gap-3">
        <div class="h-5 w-36 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700/60" />
        <div class="h-5 w-16 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700/60" />
        <div class="h-5 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700/60" />
      </div>
      <div class="h-8 w-1/2 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700/60" />
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div class="lg:col-span-2 space-y-5">
          <div class="h-52 w-full animate-pulse rounded-card bg-slate-200 dark:bg-slate-700/60" />
          <div class="h-36 w-full animate-pulse rounded-card bg-slate-200 dark:bg-slate-700/60" />
        </div>
        <div class="h-72 w-full animate-pulse rounded-card bg-slate-200 dark:bg-slate-700/60" />
      </div>
    </div>

    <ErrorState v-else-if="!ticket" :on-retry="true" message="Ticket not found or could not be loaded." @retry="load" />

    <template v-else>
      <!-- Title row -->
      <div class="flex flex-wrap items-start justify-between gap-4 mb-6 smooth-fade-up">
        <div class="min-w-0">
          <div class="flex items-center gap-3 flex-wrap mb-2">
            <span class="font-mono text-[12px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded whitespace-nowrap">{{ ticket.id }}</span>
            <SeverityBadge :severity="ticket.severity" />
            <StatusBadge :status="localStatus" />
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ ticket.title }}</h1>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <!-- Main -->
        <div class="lg:col-span-2 space-y-6">
          <AppCard>
            <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">Description</h3>
            <p class="text-[14px] text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{{ ticket.description }}</p>
          </AppCard>

          <!-- Screenshots -->
          <AppCard>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><AppIcon name="image" :size="16" class="text-slate-400" /> Screenshots</h3>
              <span class="text-[12px] text-slate-400">{{ ticket.images.length }} attached</span>
            </div>
            <div v-if="ticket.images.length" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button v-for="(img, i) in ticket.images" :key="img.id" @click="galleryIndex = i"
                class="aspect-[4/3] border-round overflow-hidden hover:ring-2 hover:ring-brand transition-all bg-slate-100 dark:bg-slate-800">
                <img :src="img.url" :alt="img.filename" class="w-full h-full object-cover" />
              </button>
            </div>
            <div v-else class="text-center py-8 text-[13px] text-slate-400 border-round-dashed">
              No screenshots were attached to this report.
            </div>
          </AppCard>

          <!-- Activity -->
          <AppCard>
            <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><AppIcon name="clock" :size="16" class="text-slate-400" /> Activity</h3>
            <div class="space-y-0">
              <div v-for="(ev, i) in localTimeline" :key="i" class="flex gap-3 relative pb-5 last:pb-0">
                <span v-if="i < localTimeline.length - 1" class="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
                <AvatarComp v-if="ev.type === 'comment'" :name="ev.actor" :size="32" />
                <span v-else :class="['w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                  ev.type === 'created'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400']">
                  <AppIcon :name="ev.type === 'created' ? 'bug' : 'refresh'" :size="15" />
                </span>
                <div class="min-w-0 flex-1 pt-0.5">
                  <div class="text-[13px]">
                    <span class="font-semibold text-slate-800 dark:text-slate-100">{{ ev.actor }}</span>
                    <span class="text-slate-500 dark:text-slate-400"> {{ ev.type === 'comment' ? 'added a note' : ev.text }}</span>
                    <span class="text-slate-300 dark:text-slate-600"> · {{ relTime(ev.createdAt) }}</span>
                  </div>
                  <p v-if="ev.type === 'comment'" class="mt-1.5 text-[13px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-lg px-3 py-2 leading-relaxed">{{ ev.text }}</p>
                </div>
              </div>
            </div>
            <!-- Add note -->
            <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <AvatarComp name="Maya Tran" :size="32" />
              <div class="flex-1">
                <textarea v-model="noteText" rows="2" placeholder="Add a note or update…"
                  class="w-full px-3 py-2 border-round-sm bg-white dark:bg-slate-900 text-[13px] text-slate-700 dark:text-slate-200 outline-none focus:border-brand resize-none" />
                <div class="flex justify-end mt-2">
                  <AppButton size="sm" :disabled="!noteText.trim()" @click="addNote">Comment</AppButton>
                </div>
              </div>
            </div>
          </AppCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-5 lg:sticky lg:top-6">
          <AppCard>
            <h3 class="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Status</h3>
            <div class="relative" ref="dropdownRef">
              <button @click="dropdownOpen = !dropdownOpen"
                class="w-full flex items-center justify-between h-10 px-3 border-round-sm bg-white dark:bg-slate-900 hover:border-slate-300 transition-colors">
                <span class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full" :style="{ background: STATUS_META[localStatus].dot }" />
                  <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ STATUS_META[localStatus].label }}</span>
                </span>
                <AppIcon name="chevronDown" :size="15" class="text-slate-400" />
              </button>
              <div v-if="dropdownOpen" class="absolute z-30 mt-1.5 w-full bg-white dark:bg-slate-800 border-round shadow-lg p-1.5">
                <button v-for="s in TICKET_STATUSES" :key="s" @click="changeStatus(s)"
                  class="w-full flex items-center gap-2.5 px-2.5 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-left">
                  <span class="w-2 h-2 rounded-full" :style="{ background: STATUS_META[s].dot }" />
                  <span class="flex-1 text-sm text-slate-700 dark:text-slate-200">{{ STATUS_META[s].label }}</span>
                  <AppIcon v-if="localStatus === s" name="check" :size="15" class="text-brand" />
                </button>
              </div>
            </div>

            <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              <div v-for="row in metaRows" :key="row.label" class="flex items-start gap-3 py-2.5">
                <AppIcon :name="row.icon" :size="16" class="text-slate-400 mt-0.5 shrink-0" />
                <div class="min-w-0 flex-1">
                  <div class="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{{ row.label }}</div>
                  <component :is="row.component || 'div'" v-bind="row.props" class="text-[13px] text-slate-700 dark:text-slate-200 mt-0.5 break-words">
                    <template v-if="row.slot" v-html="row.slot" />
                    <span v-else>{{ row.value }}</span>
                  </component>
                </div>
              </div>
            </div>
          </AppCard>
        </div>
      </div>

      <ImagePreviewModal v-model="galleryIndex" :images="ticket.images" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useTicketStore }  from '@/stores/ticket.store'
import { useProjectStore } from '@/stores/project.store'
import { useToast } from '@/composables/useToast'
import { STATUS_META, TICKET_STATUSES } from '@/constants'
import AppCard     from '@/components/ui/AppCard.vue'
import AppButton   from '@/components/ui/AppButton.vue'
import AppIcon     from '@/components/ui/AppIcon.vue'
import ErrorState  from '@/components/ui/ErrorState.vue'
import SeverityBadge from '@/components/ui/SeverityBadge.vue'
import StatusBadge   from '@/components/ui/StatusBadge.vue'
import AvatarComp    from '@/components/ui/AvatarComp.vue'
import ImagePreviewModal from '@/components/tickets/ImagePreviewModal.vue'
import type { TicketStatus, TimelineEntry } from '@/types'

const ticketStore  = useTicketStore()
const projectStore = useProjectStore()
const { success: toastSuccess, error: toastError } = useToast()
const route = useRoute()

const galleryIndex  = ref(-1)
const dropdownOpen  = ref(false)
const dropdownRef   = ref<HTMLElement>()
const noteText      = ref('')
const localStatus   = ref<TicketStatus>('open')
const localTimeline = ref<TimelineEntry[]>([])

const ticket = computed(() => ticketStore.currentTicket)

const metaRows = computed(() => {
  const t = ticket.value
  if (!t) return []
  const proj = projectStore.getById(t.projectId)
  return [
    { icon: 'projects',  label: 'Project',         value: proj?.name ?? t.projectId },
    { icon: 'alert',     label: 'Severity',         value: t.severity },
    { icon: 'user',      label: 'Reporter',         value: t.reporterName },
    { icon: 'calendar',  label: 'Created',          value: fmtDateTime(t.createdAt) },
    { icon: 'link',      label: 'Page URL',         value: t.pageUrl },
    { icon: 'monitor',   label: 'Browser / device', value: t.browserInfo },
  ]
})

async function load() {
  await Promise.all([
    ticketStore.fetchOne(route.params.id as string),
    projectStore.fetch(),
  ])
  if (ticket.value) {
    localStatus.value   = ticket.value.status
    localTimeline.value = ticket.value.timeline ? [...ticket.value.timeline] : []
  }
}

async function changeStatus(s: TicketStatus) {
  dropdownOpen.value = false
  if (s === localStatus.value || !ticket.value) return
  try {
    const updated = await ticketStore.updateStatus(ticket.value.id, s)
    localStatus.value = updated.status
    localTimeline.value.push({ id: Date.now().toString(), type: 'status', actor: 'Maya Tran',
      text: 'changed status to ' + STATUS_META[s].label, createdAt: new Date().toISOString(), to: s })
    toastSuccess('Status updated', ticket.value.id + ' is now ' + STATUS_META[s].label + '.')
  } catch { toastError('Update failed', 'Could not update the ticket status.') }
}

function addNote() {
  if (!noteText.value.trim()) return
  localTimeline.value.push({
    id: Date.now().toString(), type: 'comment', actor: 'Maya Tran',
    text: noteText.value.trim(), createdAt: new Date().toISOString()
  })
  noteText.value = ''
}

function onOutsideClick(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) dropdownOpen.value = false
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}
function relTime(iso: string) {
  const d = Math.floor((Date.now() - +new Date(iso)) / 86400000)
  if (d <= 0) { const h = Math.floor((Date.now() - +new Date(iso)) / 3600000); return h <= 0 ? 'just now' : h + 'h ago' }
  return d === 1 ? 'yesterday' : d + 'd ago'
}

onMounted(() => { load(); document.addEventListener('mousedown', onOutsideClick) })
onUnmounted(() => document.removeEventListener('mousedown', onOutsideClick))
</script>
