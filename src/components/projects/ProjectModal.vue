<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
        @click.self="close">
        <Transition name="modal-panel" appear>
          <div v-if="modelValue"
            class="w-full max-w-[520px] max-h-[90dvh] overflow-y-auto bg-white dark:bg-slate-900 border-round-lg shadow-2xl">

            <!-- Header -->
            <div class="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                  <AppIcon name="projects" :size="16" />
                </span>
                <h2 class="text-base font-bold text-slate-800 dark:text-white">
                  {{ isEdit ? 'Edit project' : 'New project' }}
                </h2>
              </div>
              <button type="button" @click="close"
                class="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <AppIcon name="x" :size="17" />
              </button>
            </div>

            <form @submit.prevent="handleSubmit" class="p-6 space-y-4">

              <!-- Name -->
              <FieldWrapper label="Project name" required :error="errors.name">
                <input v-model="form.name" placeholder="e.g. Hermes Web App"
                  class="form-input" :class="errors.name ? 'border-rose-400' : ''" autofocus />
              </FieldWrapper>

              <!-- Code + Status -->
              <div class="grid grid-cols-2 gap-4">
                <FieldWrapper label="Project code" required hint="Max 6 chars" :error="errors.code">
                  <input v-model="form.code" maxlength="6" placeholder="HWA"
                    class="form-input uppercase tracking-widest font-mono"
                    :class="errors.code ? 'border-rose-400' : ''"
                    @input="form.code = (form.code as string).toUpperCase()" />
                </FieldWrapper>

                <FieldWrapper label="Status">
                  <div class="flex h-11 rounded-btn border-round-sm overflow-hidden p-0.5 gap-0.5 bg-slate-50 dark:bg-slate-800">
                    <button v-for="s in (['Active', 'Archived'] as const)" :key="s" type="button" @click="form.status = s"
                      :class="['flex-1 text-[13px] font-semibold rounded-[6px] transition-all duration-150',
                        form.status === s
                          ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200']">
                      {{ s }}
                    </button>
                  </div>
                </FieldWrapper>
              </div>

              <!-- Description -->
              <FieldWrapper label="Description" hint="Optional">
                <textarea v-model="form.description" rows="2"
                  placeholder="What does this project track?"
                  class="form-input resize-none py-2.5 leading-relaxed" />
              </FieldWrapper>

              <!-- ── Hermes Agent ──────────────────────────────────────────── -->
              <div class="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div class="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                  <AppIcon name="sparkle" :size="14" class="text-brand" />
                  <span class="text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Hermes Agent</span>
                </div>

                <div class="p-4 space-y-3">
                  <!-- Agent profile selector -->
                  <FieldWrapper label="Agent profile" hint="Used for daily summaries">
                    <div class="space-y-1.5">
                      <!-- None option -->
                      <button type="button" @click="form.hermes_profile = ''"
                        :class="['w-full flex items-center gap-3 px-3 py-2 rounded-btn text-left transition-all border-2',
                          !form.hermes_profile
                            ? 'border-slate-300 dark:border-slate-500 bg-slate-50 dark:bg-slate-800'
                            : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50']">
                        <span class="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 text-sm shrink-0">—</span>
                        <div class="min-w-0">
                          <div class="text-[13px] font-medium text-slate-600 dark:text-slate-300">Use schedule default</div>
                          <div class="text-[11px] text-slate-400">Follows global fallback profile</div>
                        </div>
                        <AppIcon v-if="!form.hermes_profile" name="check" :size="14" class="text-brand ml-auto shrink-0" />
                      </button>

                      <!-- Profile options -->
                      <button v-for="p in cliProfiles" :key="p.name" type="button"
                        @click="form.hermes_profile = p.name"
                        :class="['w-full flex items-center gap-3 px-3 py-2 rounded-btn text-left transition-all border-2',
                          form.hermes_profile === p.name
                            ? 'border-brand bg-brand/5 dark:bg-brand/10'
                            : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50']">
                        <span class="w-7 h-7 rounded-lg flex items-center justify-center text-base shrink-0"
                          :style="{ background: profileColor(p.provider) + '20' }">
                          {{ profileEmoji(p.provider) }}
                        </span>
                        <div class="min-w-0 flex-1">
                          <div class="flex items-center gap-1.5">
                            <span class="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">{{ p.name }}</span>
                            <span v-if="p.isDefault" class="text-[9px] font-bold px-1 py-0.5 rounded bg-brand text-white shrink-0">◆</span>
                          </div>
                          <div class="text-[11px] text-slate-400 font-mono truncate">{{ p.model }} · {{ p.provider }}</div>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                          <span :class="['w-1.5 h-1.5 rounded-full', p.gatewayState === 'running' ? 'bg-emerald-500' : 'bg-slate-300']" />
                          <AppIcon v-if="form.hermes_profile === p.name" name="check" :size="14" class="text-brand" />
                        </div>
                      </button>
                    </div>
                  </FieldWrapper>

                  <!-- Cron toggle + expression -->
                  <div class="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Daily summary</div>
                        <div class="text-[11px] text-slate-400 mt-0.5">
                          {{ form.cron_enabled
                            ? (form.cron_expr || '0 8 * * *') + ' — auto-runs daily'
                            : 'Disabled — run manually only' }}
                        </div>
                      </div>
                      <button type="button" role="switch" :aria-checked="form.cron_enabled"
                        @click="form.cron_enabled = !form.cron_enabled"
                        :class="['relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                          form.cron_enabled ? 'bg-brand' : 'bg-slate-200 dark:bg-slate-600']">
                        <span :class="['pointer-events-none block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200',
                          form.cron_enabled ? 'translate-x-5' : 'translate-x-0']" />
                      </button>
                    </div>

                    <Transition name="slide-down">
                      <div v-if="form.cron_enabled" class="space-y-3">
                        <div>
                          <label class="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                            Schedule
                            <span class="font-normal ml-1">(<a href="https://crontab.guru" target="_blank" class="text-brand hover:underline">crontab.guru</a> · blank = 08:00 daily)</span>
                          </label>
                          <input v-model="form.cron_expr" placeholder="0 8 * * *" class="form-input font-mono text-[13px] mt-1.5" />
                        </div>
                        <div class="flex items-start gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                          <AppIcon name="sparkle" :size="13" class="text-brand shrink-0 mt-0.5" />
                          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Agent summarises <strong>all outstanding tickets</strong> (open + in&nbsp;progress) — regardless of when they were created.
                          </p>
                        </div>
                      </div>
                    </Transition>
                  </div>

                  <!-- Discord Webhook (per-project override) -->
                  <div class="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <label class="text-[13px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <span>💬</span> Discord Webhook URL
                      <span class="text-[11px] font-normal text-slate-400">overrides global setting</span>
                    </label>
                    <input v-model="form.discord_webhook_url"
                      placeholder="https://discord.com/api/webhooks/... (leave blank = use global)"
                      class="form-input font-mono text-[12px]" />
                  </div>

                  <!-- Design context path -->
                  <FieldWrapper label="Design context path" hint="Agent reads this for context">
                    <div class="relative">
                      <AppIcon name="link" :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input v-model="form.design_context_path"
                        placeholder="/docs/design-context.md"
                        class="form-input pl-9 font-mono text-[13px]" />
                    </div>
                  </FieldWrapper>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2.5 pt-2">
                <AppButton type="submit" :loading="saving" size="md" class="flex-1">
                  {{ isEdit ? 'Save changes' : 'Create project' }}
                </AppButton>
                <AppButton type="button" variant="ghost" size="md" @click="close" :disabled="saving">
                  Cancel
                </AppButton>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref, watch, onMounted } from 'vue'
import AppIcon      from '@/components/ui/AppIcon.vue'
import AppButton    from '@/components/ui/AppButton.vue'
import FieldWrapper from '@/components/ui/FieldWrapper.vue'
import { projectApi } from '@/services/project.api'
import { configApi, type HermesCLIProfile } from '@/services/config.api'
import { useToast } from '@/composables/useToast'
import type { Project } from '@/types'

const props = defineProps<{ modelValue: boolean; project?: Project | null }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean]; saved: [p: Project] }>()

const { success: toastSuccess, error: toastError } = useToast()
const saving     = ref(false)
const isEdit     = ref(false)
const cliProfiles = ref<HermesCLIProfile[]>([])

const EMOJIS: Record<string, string> = {
  anthropic: '🔬', openai: '⚡', 'openai-codex': '⚡', deepseek: '🌊',
  'opencode-go': '🧬', ollama: '🦙', lmstudio: '🎛️',
}
const COLORS: Record<string, string> = {
  anthropic: '#ec4899', openai: '#10b981', 'openai-codex': '#10b981',
  deepseek: '#6366f1', 'opencode-go': '#a78bfa', ollama: '#f59e0b',
}
function profileEmoji(p: string) {
  for (const k of Object.keys(EMOJIS)) { if (p?.includes(k)) return EMOJIS[k] }
  return '🤖'
}
function profileColor(p: string) {
  for (const k of Object.keys(COLORS)) { if (p?.includes(k)) return COLORS[k] }
  return '#94a3b8'
}

const form = reactive({
  name: '', code: '', description: '',
  status: 'Active' as 'Active' | 'Archived',
  design_context_path: '',
  hermes_profile: '',
  cron_enabled:          false,
  cron_expr:             '',
  cron_window_hours:     24,
  discord_webhook_url:   '',
})
const errors = reactive<Record<string, string>>({})

onMounted(async () => {
  try { cliProfiles.value = await configApi.listHermesCLI() } catch {}
})

watch(() => props.modelValue, (open) => {
  if (!open) return
  Object.keys(errors).forEach(k => delete errors[k])

  if (props.project) {
    isEdit.value = true
    Object.assign(form, {
      name: props.project.name,
      code: props.project.code,
      description: (props.project as any).description ?? '',
      status: props.project.status,
      design_context_path: (props.project as any).design_context_path ?? '',
      hermes_profile: (props.project as any).hermesProfile ?? '',
      cron_enabled:          (props.project as any).cronEnabled          ?? false,
      cron_expr:             (props.project as any).cronExpr             ?? '',
      cron_window_hours:     (props.project as any).cronWindowHours      ?? 24,
      discord_webhook_url:   (props.project as any).discordWebhookUrl    ?? '',
    })
  } else {
    isEdit.value = false
    Object.assign(form, { name: '', code: '', description: '', status: 'Active', design_context_path: '', hermes_profile: '', cron_enabled: false, cron_expr: '', cron_window_hours: 24, discord_webhook_url: '' })
  }
})

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.name.trim()) errors.name = 'Project name is required.'
  if (!form.code.trim()) errors.code = 'Project code is required.'
  else if (form.code.length < 2) errors.code = 'Code must be at least 2 characters.'
  return !Object.keys(errors).length
}

async function handleSubmit() {
  if (!validate()) return
  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      status: form.status,
      design_context_path: form.design_context_path.trim() || undefined,
      hermes_profile: form.hermes_profile || null,
      cron_enabled:          form.cron_enabled,
      cron_expr:             form.cron_expr.trim() || null,
      cron_window_hours:     form.cron_window_hours,
      discord_webhook_url:   form.discord_webhook_url.trim() || null,
    }
    const saved = isEdit.value && props.project
      ? await projectApi.update(props.project.id, payload)
      : await projectApi.create(payload)

    toastSuccess(isEdit.value ? 'Project updated' : 'Project created', saved.name)
    emit('saved', saved)
    close()
  } catch (err: any) {
    toastError('Failed to save', err?.response?.data?.message ?? 'Something went wrong.')
  } finally {
    saving.value = false
  }
}

function close() { if (!saving.value) emit('update:modelValue', false) }
</script>

<style scoped>
.form-input {
  @apply w-full h-11 px-3.5 rounded-btn border border-slate-200 dark:border-slate-700
    bg-white dark:bg-slate-800/60 text-sm text-slate-800 dark:text-slate-100
    placeholder:text-slate-400 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15;
}
textarea.form-input { height: auto; }
.modal-backdrop-enter-active, .modal-backdrop-leave-active { transition: opacity 0.2s ease; }
.modal-backdrop-enter-from, .modal-backdrop-leave-to { opacity: 0; }
.modal-panel-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.modal-panel-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.modal-panel-enter-from   { opacity: 0; transform: scale(0.96) translateY(8px); }
.modal-panel-leave-to     { opacity: 0; transform: scale(0.97) translateY(4px); }
.slide-down-enter-active  { transition: opacity 0.2s ease, max-height 0.2s ease; max-height: 200px; }
.slide-down-leave-active  { transition: opacity 0.15s ease, max-height 0.15s ease; max-height: 200px; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; max-height: 0; overflow: hidden; }
</style>
