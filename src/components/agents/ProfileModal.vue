<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div v-if="modelValue"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm"
        @click.self="close">
        <Transition name="modal-panel" appear>
          <div v-if="modelValue"
            class="w-full sm:max-w-2xl max-h-[92dvh] overflow-y-auto bg-white dark:bg-slate-900 border-round-lg shadow-2xl flex flex-col">

            <!-- Header -->
            <div class="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl flex items-center justify-center text-lg shrink-0"
                  :style="{ background: activeSoulPreset?.color + '18' }">
                  {{ providerMeta[form.provider]?.icon ?? '🤖' }}
                </span>
                <div>
                  <h2 class="text-[15px] font-bold text-slate-800 dark:text-white leading-tight">
                    {{ isEdit ? 'Edit agent profile' : 'New agent profile' }}
                  </h2>
                  <p class="text-[11px] text-slate-400 mt-px">{{ form.name || 'Untitled' }}</p>
                </div>
              </div>
              <button type="button" @click="close"
                class="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <AppIcon name="x" :size="17" />
              </button>
            </div>

            <form @submit.prevent="handleSubmit" class="flex-1 p-6 space-y-6">

              <!-- Identity -->
              <section class="space-y-4">
                <h3 class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Identity</h3>
                <div class="grid grid-cols-2 gap-4">
                  <FieldWrapper label="Agent name" required :error="errors.name" class="col-span-2 sm:col-span-1">
                    <input v-model="form.name" placeholder="e.g. Bug Detective" class="form-input" autofocus />
                  </FieldWrapper>
                  <FieldWrapper label="Description" class="col-span-2 sm:col-span-1">
                    <input v-model="form.description" placeholder="What this agent specializes in" class="form-input" />
                  </FieldWrapper>
                </div>
              </section>

              <!-- Provider + Model -->
              <section class="space-y-4">
                <h3 class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Provider & Model</h3>

                <!-- Provider pills -->
                <div class="flex flex-wrap gap-2">
                  <button v-for="p in providers" :key="p.id" type="button" @click="selectProvider(p)"
                    :class="['flex items-center gap-2 px-3 h-9 rounded-xl border-2 text-[13px] font-semibold transition-all duration-150',
                      form.provider === p.id
                        ? 'border-brand bg-brand/5 dark:bg-brand/10 text-brand'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300']">
                    <span class="text-base">{{ providerMeta[p.id]?.icon ?? '🤖' }}</span>
                    {{ p.name }}
                    <span :class="['w-1.5 h-1.5 rounded-full shrink-0', p.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600']" />
                  </button>
                </div>

                <!-- Model -->
                <FieldWrapper label="Model" :error="errors.model">
                  <template v-if="activeProvider?.models.length">
                    <select v-model="form.model" class="form-input appearance-none cursor-pointer">
                      <option value="">Select a model…</option>
                      <option v-for="m in activeProvider.models" :key="m.id" :value="m.id">
                        {{ m.name }}{{ m.size ? ` (${m.size})` : '' }}
                      </option>
                    </select>
                  </template>
                  <template v-else>
                    <input v-model="form.model" placeholder="e.g. llama3.2, gpt-4o" class="form-input font-mono text-[13px]" />
                  </template>
                </FieldWrapper>

                <!-- Endpoint (local only) -->
                <FieldWrapper v-if="activeProvider?.type === 'local'" label="Endpoint">
                  <input v-model="form.endpoint" class="form-input font-mono text-[13px]" />
                </FieldWrapper>

                <!-- API Key (cloud only) -->
                <FieldWrapper v-if="activeProvider?.requiresApiKey" label="API Key"
                  :hint="form.apiKeySet ? 'Key saved — enter new to replace' : undefined">
                  <div class="relative">
                    <input v-model="form.apiKey" :type="showKey ? 'text' : 'password'"
                      placeholder="sk-… or leave blank to keep existing"
                      class="form-input pr-10 font-mono text-[13px]" />
                    <button type="button" @click="showKey = !showKey"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      <AppIcon :name="showKey ? 'eyeOff' : 'eye'" :size="15" />
                    </button>
                  </div>
                </FieldWrapper>
              </section>

              <!-- Soul -->
              <section class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Soul · System Prompt</h3>
                  <span class="text-[11px] text-slate-400">{{ form.soul.length }} chars</span>
                </div>

                <!-- Preset pills -->
                <div class="flex flex-wrap gap-2">
                  <button v-for="(p, key) in soulPresets" :key="key" type="button"
                    @click="applySoulPreset(key)"
                    :class="['px-2.5 h-7 rounded-lg text-[12px] font-semibold transition-all duration-150 border',
                      form.soulPreset === key
                        ? 'text-white border-transparent'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 bg-white dark:bg-slate-900']"
                    :style="form.soulPreset === key ? { background: p.color } : {}">
                    {{ p.label }}
                  </button>
                </div>

                <!-- Soul textarea -->
                <div class="relative">
                  <div class="absolute top-3 left-3 text-slate-300 dark:text-slate-700 select-none text-2xl leading-none font-serif">"</div>
                  <textarea v-model="form.soul" rows="6"
                    placeholder="Describe how Hermes should think, analyze, and communicate…"
                    class="form-input resize-none py-3 pl-8 leading-relaxed text-[13px]" />
                </div>
              </section>

              <!-- Skills -->
              <section class="space-y-4">
                <h3 class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Skills</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button v-for="(skill, key) in skills" :key="key" type="button"
                    @click="toggleSkill(key)"
                    :class="['flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all duration-150',
                      form.skills.includes(key)
                        ? 'border-brand bg-brand/5 dark:bg-brand/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600']">
                    <span :class="['mt-0.5 w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
                      form.skills.includes(key) ? 'bg-brand border-brand' : 'border-slate-300 dark:border-slate-600']">
                      <AppIcon v-if="form.skills.includes(key)" name="check" :size="10" class="text-white" :stroke-width="3" />
                    </span>
                    <div class="min-w-0">
                      <div class="text-[13px] font-semibold text-slate-800 dark:text-slate-100">{{ skill.label }}</div>
                      <div class="text-[11px] text-slate-400 mt-0.5">{{ skill.description }}</div>
                    </div>
                  </button>
                </div>
              </section>

              <!-- Enable toggle -->
              <section>
                <div class="flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <div class="text-sm font-semibold text-slate-700 dark:text-slate-200">Active</div>
                    <div class="text-[12px] text-slate-400 mt-0.5">Enable this profile for Hermes tasks</div>
                  </div>
                  <button type="button" role="switch" :aria-checked="form.enabled" @click="form.enabled = !form.enabled"
                    :class="['relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                      form.enabled ? 'bg-brand' : 'bg-slate-200 dark:bg-slate-600']">
                    <span :class="['pointer-events-none block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200',
                      form.enabled ? 'translate-x-5' : 'translate-x-0']" />
                  </button>
                </div>
              </section>

              <!-- Actions -->
              <div class="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <AppButton type="submit" :loading="saving" class="flex-1">
                  {{ isEdit ? 'Save changes' : 'Create profile' }}
                </AppButton>
                <AppButton type="button" variant="ghost" @click="close" :disabled="saving">Cancel</AppButton>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import AppIcon     from '@/components/ui/AppIcon.vue'
import AppButton   from '@/components/ui/AppButton.vue'
import FieldWrapper from '@/components/ui/FieldWrapper.vue'
import { configApi, type HermesProfile, type ProviderInfo, type AgentMeta } from '@/services/config.api'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  modelValue: boolean
  profile?: HermesProfile | null
  providers: ProviderInfo[]
  meta: AgentMeta | null
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  saved: [p: HermesProfile]
}>()

const { success: toastOk, error: toastErr } = useToast()

const saving  = ref(false)
const showKey = ref(false)
const isEdit  = computed(() => !!props.profile)

const providerMeta: Record<string, { icon: string }> = {
  ollama:    { icon: '🦙' },
  lmstudio:  { icon: '🎛️' },
  openai:    { icon: '⚡' },
  anthropic: { icon: '🔬' },
  google:    { icon: '✨' },
}

const skills     = computed(() => props.meta?.skills     ?? {})
const soulPresets = computed(() => props.meta?.soulPresets ?? {})
const activeSoulPreset = computed(() => soulPresets.value[form.soulPreset] ?? null)
const activeProvider   = computed(() => props.providers.find(p => p.id === form.provider) ?? null)

const form = reactive({
  name: '', description: '', provider: 'ollama', endpoint: 'http://localhost:11434',
  model: '', apiKey: '', soul: '', soulPreset: 'bug_detective',
  skills: ['daily_summary'] as string[], enabled: false, apiKeySet: false,
})
const errors = reactive<Record<string, string>>({})

watch(() => props.modelValue, open => {
  if (!open) return
  Object.keys(errors).forEach(k => delete errors[k])
  showKey.value = false

  if (props.profile) {
    Object.assign(form, {
      name: props.profile.name, description: props.profile.description,
      provider: props.profile.provider, endpoint: props.profile.endpoint,
      model: props.profile.model, apiKey: '',
      soul: props.profile.soul, soulPreset: props.profile.soulPreset,
      skills: [...props.profile.skills], enabled: props.profile.enabled,
      apiKeySet: props.profile.apiKeySet,
    })
  } else {
    Object.assign(form, {
      name: '', description: '', provider: 'ollama', endpoint: 'http://localhost:11434',
      model: '', apiKey: '', soul: soulPresets.value['bug_detective']?.soul ?? '',
      soulPreset: 'bug_detective', skills: ['daily_summary'], enabled: false, apiKeySet: false,
    })
  }
})

function selectProvider(p: ProviderInfo) {
  form.provider = p.id
  form.endpoint = p.endpoint
  form.model = ''
}

function applySoulPreset(key: string) {
  form.soulPreset = key
  if (key !== 'custom') form.soul = soulPresets.value[key]?.soul ?? ''
}

function toggleSkill(key: string) {
  const idx = form.skills.indexOf(key)
  if (idx >= 0) form.skills.splice(idx, 1)
  else form.skills.push(key)
}

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.name.trim()) errors.name = 'Agent name is required.'
  return !Object.keys(errors).length
}

async function handleSubmit() {
  if (!validate()) return
  saving.value = true
  try {
    const payload = {
      name: form.name.trim(), description: form.description.trim(),
      provider: form.provider, endpoint: form.endpoint, model: form.model,
      soul: form.soul, soulPreset: form.soulPreset,
      skills: form.skills, enabled: form.enabled,
      apiKey: form.apiKey || undefined,
    }

    const saved = isEdit.value && props.profile
      ? await configApi.updateProfile(props.profile.id, payload)
      : await configApi.createProfile(payload)

    toastOk(isEdit.value ? 'Profile updated' : 'Profile created', saved.name)
    emit('saved', saved)
    close()
  } catch (err: any) {
    toastErr('Save failed', err?.response?.data?.message ?? 'Something went wrong.')
  } finally {
    saving.value = false
  }
}

function close() {
  if (saving.value) return
  emit('update:modelValue', false)
}
</script>

<style scoped>
.form-input {
  @apply w-full h-11 px-3.5 rounded-btn border border-slate-200 dark:border-slate-700
    bg-white dark:bg-slate-800/60
    text-sm text-slate-800 dark:text-slate-100
    placeholder:text-slate-400
    outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15;
}
textarea.form-input { height: auto; }

.modal-backdrop-enter-active, .modal-backdrop-leave-active { transition: opacity 0.2s ease; }
.modal-backdrop-enter-from, .modal-backdrop-leave-to { opacity: 0; }
.modal-panel-enter-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.modal-panel-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.modal-panel-enter-from   { opacity: 0; transform: scale(0.96) translateY(10px); }
.modal-panel-leave-to     { opacity: 0; transform: scale(0.97); }
</style>
