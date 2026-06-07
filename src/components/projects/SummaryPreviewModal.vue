<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        @click.self="$emit('update:modelValue', false)">
        <Transition name="modal-panel" appear>
          <div v-if="modelValue"
            class="w-full max-w-3xl max-h-[90dvh] flex flex-col bg-white dark:bg-slate-900 border-round-lg shadow-2xl overflow-hidden">

            <!-- Header -->
            <div class="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                  <AppIcon name="sparkle" :size="16" />
                </span>
                <div>
                  <h2 class="text-[15px] font-bold text-slate-800 dark:text-white">Agent Prompt Preview</h2>
                  <p class="text-[11px] text-slate-400 mt-px">{{ project?.name }} · open + in&nbsp;progress · {{ data?.payload.counts.total ?? 0 }} tickets</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <AppButton size="sm" :loading="running" icon="refresh" @click="$emit('run')">Run now</AppButton>
                <button @click="$emit('update:modelValue', false)"
                  class="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400">
                  <AppIcon name="x" :size="17" />
                </button>
              </div>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="flex-1 flex items-center justify-center p-12">
              <div class="text-center space-y-3">
                <AppIcon name="refresh" :size="28" class="text-brand animate-spin mx-auto" />
                <p class="text-sm text-slate-500 dark:text-slate-400">Building payload…</p>
              </div>
            </div>

            <div v-else-if="data" class="flex-1 overflow-y-auto">
              <!-- Stats bar -->
              <div class="grid grid-cols-4 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
                <div v-for="(val, key) in severityStats" :key="key"
                  class="flex flex-col items-center py-3 gap-1">
                  <span class="text-xl font-bold tabular-nums" :style="{ color: severityColors[key] }">{{ val }}</span>
                  <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{{ key }}</span>
                </div>
              </div>

              <!-- Tabs -->
              <div class="flex border-b border-slate-100 dark:border-slate-800 px-4">
                <button v-for="t in tabs" :key="t.id" @click="activeTab = t.id"
                  :class="['px-3 py-2.5 text-[13px] font-semibold border-b-2 transition-colors',
                    activeTab === t.id
                      ? 'border-brand text-brand'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200']">
                  {{ t.label }}
                </button>
              </div>

              <!-- Prompt tab -->
              <div v-if="activeTab === 'prompt'" class="p-4">
                <div class="relative">
                  <button @click="copyPrompt"
                    class="absolute top-2 right-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-brand transition-colors bg-white dark:bg-slate-900 px-2 py-1 rounded-md">
                    <AppIcon name="copy" :size="12" />{{ copied ? 'Copied!' : 'Copy' }}
                  </button>
                  <pre class="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-mono bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 pr-16 overflow-x-auto max-h-[50dvh]">{{ data.prompt }}</pre>
                </div>
              </div>

              <!-- Tickets tab -->
              <div v-else-if="activeTab === 'tickets'" class="p-4 space-y-2">
                <div v-if="!data.payload.tickets.length" class="text-center py-10 text-slate-400 text-sm">
                  No outstanding tickets (open / in progress)
                </div>
                <div v-for="t in data.payload.tickets" :key="t.id"
                  class="flex items-start gap-3 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/60">
                  <div class="w-1 self-stretch rounded-full shrink-0"
                    :style="{ background: severityColors[t.severity] ?? '#94a3b8' }" />
                  <div class="min-w-0 flex-1 space-y-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">{{ t.title }}</span>
                      <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                        :style="{ background: severityColors[t.severity] + '20', color: severityColors[t.severity] }">
                        {{ t.severity }}
                      </span>
                      <span class="text-[10px] text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                        {{ t.status.replace('_', ' ') }}
                      </span>
                    </div>
                    <p class="text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2">{{ t.description }}</p>
                    <div class="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>{{ t.reporter }}</span>
                      <span>{{ new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</span>
                      <span v-if="t.page_url" class="truncate max-w-[160px] font-mono">{{ t.page_url }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- JSON tab -->
              <div v-else-if="activeTab === 'json'" class="p-4">
                <pre class="text-[11.5px] text-slate-700 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 overflow-auto max-h-[50dvh]">{{ JSON.stringify(data.payload, null, 2) }}</pre>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[12px] text-slate-400">
              <span>profile: <code class="font-mono text-brand">{{ project?.hermesProfile || 'default' }}</code></span>
              <span>scope: <code class="font-mono">open + in progress</code> · {{ data?.payload.generated_at ? new Date(data.payload.generated_at).toLocaleTimeString() : '' }}</span>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AppIcon   from '@/components/ui/AppIcon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { api } from '@/services/api'
import type { Project } from '@/types'

const props = defineProps<{
  modelValue: boolean
  project: Project | null
  running?: boolean
}>()

defineEmits<{ 'update:modelValue': [v: boolean]; run: [] }>()

const loading   = ref(false)
const data      = ref<{ payload: any; prompt: string } | null>(null)
const activeTab = ref<'prompt' | 'tickets' | 'json'>('prompt')
const copied    = ref(false)

const tabs = [
  { id: 'prompt' as const,  label: 'Prompt sent to agent' },
  { id: 'tickets' as const, label: 'Ticket data' },
  { id: 'json' as const,    label: 'Raw JSON payload' },
]

const severityColors: Record<string, string> = {
  critical: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#94a3b8',
}

const severityStats = computed(() => {
  const c = data.value?.payload?.counts ?? {}
  return { critical: c.critical ?? 0, high: c.high ?? 0, medium: c.medium ?? 0, low: c.low ?? 0 }
})

watch(() => props.modelValue, async (open) => {
  if (!open || !props.project) return
  loading.value = true
  data.value    = null
  activeTab.value = 'prompt'
  try {
    const res = await api.get(`/projects/${props.project.id}/preview-summary`)
    data.value = res.data as any
  } finally {
    loading.value = false
  }
})

async function copyPrompt() {
  if (!data.value?.prompt) return
  await navigator.clipboard.writeText(data.value.prompt)
  copied.value = true
  setTimeout(() => { copied.value = false }, 1500)
}
</script>

<style scoped>
.modal-backdrop-enter-active, .modal-backdrop-leave-active { transition: opacity 0.2s ease; }
.modal-backdrop-enter-from,  .modal-backdrop-leave-to     { opacity: 0; }
.modal-panel-enter-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.modal-panel-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.modal-panel-enter-from   { opacity: 0; transform: scale(0.97) translateY(8px); }
.modal-panel-leave-to     { opacity: 0; transform: scale(0.98); }
</style>
