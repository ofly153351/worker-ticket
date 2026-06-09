<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div v-if="modelValue"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm"
        @click.self="close">
        <Transition name="modal-panel" appear>
          <div v-if="modelValue"
            class="w-full sm:max-w-xl max-h-[92dvh] overflow-y-auto bg-white dark:bg-slate-900 border-round-lg shadow-2xl flex flex-col">

            <!-- Header -->
            <div class="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
                  :style="{ background: activeProviderColor + '20' }">
                  {{ activeProviderEmoji }}
                </div>
                <div>
                  <h2 class="text-[15px] font-bold text-slate-800 dark:text-white leading-tight">
                    {{ isCreate ? 'New Hermes Profile' : `hermes profile · ${form.name}` }}
                  </h2>
                  <p class="text-[11px] text-slate-400 font-mono mt-px">~/.hermes{{ isCreate ? '/profiles/' + (form.name || '…') : (profile?.isDefault ? '' : '/profiles/' + profile?.name) }}</p>
                </div>
              </div>
              <button type="button" @click="close"
                class="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <AppIcon name="x" :size="17" />
              </button>
            </div>

            <form @submit.prevent="handleSubmit" class="p-6 space-y-5">

              <!-- Profile name (create only) -->
              <template v-if="isCreate">
                <div class="space-y-4">
                  <h3 class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Profile identity</h3>
                  <FieldWrapper label="Profile name" required :error="errors.name" hint="lowercase, a-z 0-9 - _">
                    <input v-model="form.name" placeholder="e.g. obx-ticket" class="form-input font-mono" autofocus
                      @input="form.name = form.name.toLowerCase().replace(/[^a-z0-9_-]/g,'')"/>
                  </FieldWrapper>
                  <FieldWrapper label="Description" hint="Used by Hermes kanban orchestrator">
                    <input v-model="form.description" placeholder="What this profile specializes in" class="form-input" />
                  </FieldWrapper>

                  <!-- Clone option -->
                  <div class="space-y-2">
                    <label class="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Clone from</label>
                    <div class="flex flex-wrap gap-2">
                      <button v-for="opt in cloneOptions" :key="opt.value" type="button"
                        @click="form.cloneFrom = opt.value"
                        :class="['px-3 h-8 rounded-lg border-2 text-[12px] font-semibold transition-all',
                          form.cloneFrom === opt.value
                            ? 'border-brand bg-brand/5 text-brand'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300']">
                        {{ opt.label }}
                      </button>
                    </div>
                  </div>
                </div>
                <div class="border-t border-slate-100 dark:border-slate-800" />
              </template>

              <!-- Provider + Model -->
              <div class="space-y-4">
                <h3 class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Model & Provider</h3>

                <!-- Provider grid -->
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button v-for="p in providers" :key="p.id" type="button" @click="selectProvider(p)"
                    :class="['flex items-center gap-2 px-3 h-10 rounded-xl border-2 text-[13px] font-semibold transition-all text-left',
                      form.provider === p.id
                        ? 'border-brand bg-brand/5 dark:bg-brand/10 text-brand'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600']">
                    <span class="text-base shrink-0">{{ providerEmoji(p.id) }}</span>
                    <span class="truncate">{{ p.label }}</span>
                  </button>
                </div>

                <!-- Base URL (editable) -->
                <FieldWrapper label="Base URL" hint="Auto-filled from provider">
                  <input v-model="form.baseUrl" class="form-input font-mono text-[13px]" placeholder="https://api.example.com/v1" />
                </FieldWrapper>

                <!-- Model selector or input -->
                <FieldWrapper label="Model" required :error="errors.model">
                  <template v-if="activeProviderModels.length">
                    <div class="grid grid-cols-1 gap-1 max-h-44 overflow-y-auto pr-1">
                      <button v-for="m in activeProviderModels" :key="m.id" type="button"
                        @click="form.model = m.id"
                        :class="['flex items-center justify-between px-3 py-2 rounded-btn text-left transition-all',
                          form.model === m.id
                            ? 'bg-brand/8 dark:bg-brand/15 border border-brand/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent']">
                        <span class="text-[13px] font-medium text-slate-700 dark:text-slate-200 font-mono">{{ m.id }}</span>
                        <AppIcon v-if="form.model === m.id" name="check" :size="14" class="text-brand shrink-0" />
                      </button>
                    </div>
                  </template>
                  <template v-else>
                    <input v-model="form.model" placeholder="e.g. llama3.2, gpt-4o, claude-sonnet-4-6"
                      class="form-input font-mono text-[13px]" />
                  </template>
                </FieldWrapper>

                <!-- API mode -->
                <FieldWrapper label="API Mode">
                  <div class="flex gap-2">
                    <button v-for="m in ['chat_completions', 'responses']" :key="m" type="button"
                      @click="form.apiMode = m"
                      :class="['flex-1 h-9 rounded-btn border-2 text-[12px] font-semibold transition-all',
                        form.apiMode === m
                          ? 'border-brand bg-brand/5 text-brand'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300']">
                      {{ m }}
                    </button>
                  </div>
                </FieldWrapper>

                <!-- Auth — adapts to provider -->
                <FieldWrapper label="Authentication">
                  <!-- local: none -->
                  <div v-if="authKind === 'local'"
                    class="text-[12px] text-slate-400 rounded-btn border border-dashed border-slate-200 dark:border-slate-700 px-3 py-2">
                    🦙 Local provider — ไม่ต้อง auth (รัน {{ form.provider }} ในเครื่อง)
                  </div>

                  <!-- oauth (codex / opencode): login + code -->
                  <div v-else-if="authKind === 'oauth'" class="space-y-2">
                    <div class="flex items-start gap-2 rounded-btn bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3 py-2">
                      <span class="text-base shrink-0">🔐</span>
                      <p class="text-[12px] text-amber-700 dark:text-amber-300 leading-relaxed">
                        <strong>{{ form.provider }}</strong> ใช้ OAuth — login บน server แล้ววางโค้ด/โทเค็น:
                        <code class="block mt-1 font-mono text-[11px] bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 rounded">hermes login</code>
                      </p>
                    </div>
                    <input v-model="form.apiKey" :type="showKey ? 'text' : 'password'"
                      placeholder="วาง auth code / token (ถ้า login บน server แล้วเว้นว่างได้)"
                      class="form-input font-mono text-[13px]" />
                  </div>

                  <!-- apikey (deepseek / anthropic / …) -->
                  <div v-else class="space-y-1.5">
                    <div class="relative">
                      <input v-model="form.apiKey" :type="showKey ? 'text' : 'password'"
                        :placeholder="props.profile?.apiKeySet ? 'API key ตั้งไว้แล้ว — วางใหม่เพื่อเปลี่ยน' : 'sk-… / API key'"
                        class="form-input pr-10 font-mono text-[13px]" />
                      <button type="button" @click="showKey = !showKey"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <AppIcon :name="showKey ? 'eyeOff' : 'eye'" :size="15" />
                      </button>
                    </div>
                    <p class="text-[11px] text-slate-400">เก็บใน <code class="font-mono">{{ envKeyName }}</code> ของ profile</p>
                  </div>
                </FieldWrapper>
              </div>

              <!-- Soul (edit only) -->
              <template v-if="!isCreate">
                <div class="border-t border-slate-100 dark:border-slate-800" />
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <h3 class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Soul · SOUL.md</h3>
                    <span class="text-[11px] text-slate-400">{{ form.soul.length }} chars</span>
                  </div>
                  <div class="relative">
                    <div class="absolute top-2.5 left-3 text-slate-200 dark:text-slate-700 text-3xl leading-none font-serif select-none">"</div>
                    <textarea v-model="form.soul" rows="7" class="form-input resize-none py-3 pl-8 leading-relaxed text-[13px]"
                      placeholder="Describe how this agent thinks, analyzes, and communicates…" />
                  </div>
                </div>
              </template>

              <!-- Actions -->
              <div class="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <AppButton type="submit" :loading="saving" class="flex-1">
                  {{ isCreate ? 'Create profile' : 'Save changes' }}
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
import AppIcon      from '@/components/ui/AppIcon.vue'
import AppButton    from '@/components/ui/AppButton.vue'
import FieldWrapper from '@/components/ui/FieldWrapper.vue'
import { configApi, type HermesCLIProfile, type HermesProvider } from '@/services/config.api'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  modelValue: boolean
  profile?: HermesCLIProfile | null
  providers: HermesProvider[]
  existingNames: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  saved: [p: HermesCLIProfile]
}>()

const { success: toastOk, error: toastErr } = useToast()
const saving  = ref(false)
const isCreate = computed(() => !props.profile)

const PROVIDER_EMOJIS: Record<string, string> = {
  anthropic: '🔬', openai: '⚡', 'openai-codex': '⚡', deepseek: '🌊',
  'opencode-go': '🧬', ollama: '🦙', lmstudio: '🎛️', groq: '⚡', mistral: '🇫🇷', together: '🤝',
}
const PROVIDER_COLORS: Record<string, string> = {
  anthropic: '#ec4899', openai: '#10b981', 'openai-codex': '#10b981', deepseek: '#6366f1',
  'opencode-go': '#a78bfa', ollama: '#f59e0b', lmstudio: '#8b5cf6', groq: '#f97316',
}

function providerEmoji(id: string) {
  for (const k of Object.keys(PROVIDER_EMOJIS)) { if (id.includes(k)) return PROVIDER_EMOJIS[k] }
  return '🤖'
}

const activeProviderEmoji = computed(() => providerEmoji(form.provider))
const activeProviderColor = computed(() => {
  for (const k of Object.keys(PROVIDER_COLORS)) { if (form.provider.includes(k)) return PROVIDER_COLORS[k] }
  return '#6366f1'
})

const activeProviderModels = computed(() => {
  const p = props.providers.find(p => p.id === form.provider)
  return p?.models ?? []
})

// auth kind per provider (mirrors backend providerAuthKind)
const authKind = computed<'local' | 'oauth' | 'apikey'>(() => {
  const p = form.provider
  if (p.includes('ollama') || p.includes('lmstudio')) return 'local'
  if (p.includes('codex') || p.includes('opencode'))  return 'oauth'
  return 'apikey'
})
const API_KEY_ENV: Record<string, string> = {
  deepseek: 'DEEPSEEK_API_KEY', openai: 'OPENAI_API_KEY', anthropic: 'ANTHROPIC_API_KEY',
  groq: 'GROQ_API_KEY', mistral: 'MISTRAL_API_KEY', together: 'TOGETHER_API_KEY', google: 'GEMINI_API_KEY',
}
const envKeyName = computed(() => {
  for (const k of Object.keys(API_KEY_ENV)) if (form.provider.includes(k)) return API_KEY_ENV[k]
  return `${form.provider.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_API_KEY`
})
const showKey = ref(false)

const cloneOptions = computed(() => [
  { label: 'Empty (no clone)', value: '' },
  ...props.existingNames.map(n => ({ label: n === 'default' ? '◆ default' : n, value: n })),
])

const form = reactive({
  name: '', description: '',
  provider: 'deepseek', model: '', baseUrl: '',
  apiMode: 'chat_completions', soul: '',
  apiKey: '',
  cloneFrom: '',
})
const errors = reactive<Record<string, string>>({})

watch(() => props.modelValue, open => {
  if (!open) return
  Object.keys(errors).forEach(k => delete errors[k])
  showKey.value = false

  if (props.profile) {
    Object.assign(form, {
      name: props.profile.name,
      description: '',
      provider: props.profile.provider,
      model: props.profile.model === '—' ? '' : props.profile.model,
      baseUrl: props.profile.baseUrl,
      apiMode: props.profile.apiMode,
      soul: props.profile.soul,
      apiKey: '',
      cloneFrom: '',
    })
  } else {
    Object.assign(form, {
      name: '', description: '',
      provider: props.providers[0]?.id ?? 'deepseek',
      model: '', baseUrl: props.providers[0]?.baseUrl ?? '',
      apiMode: 'chat_completions', soul: '', apiKey: '', cloneFrom: '',
    })
  }
})

function selectProvider(p: HermesProvider) {
  form.provider = p.id
  form.baseUrl  = p.baseUrl
  form.model    = ''
}

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (isCreate.value) {
    if (!form.name) { errors.name = 'Name is required.' }
    else if (props.existingNames.includes(form.name)) { errors.name = `Profile "${form.name}" already exists.` }
  }
  return !Object.keys(errors).length
}

async function handleSubmit() {
  if (!validate()) return
  saving.value = true
  try {
    let saved: HermesCLIProfile

    if (isCreate.value) {
      saved = await configApi.createHermesCLI({
        name: form.name, description: form.description,
        cloneFrom: form.cloneFrom || undefined,
      })
      // After create, apply model/provider/soul/auth
      if (form.provider || form.model || form.soul || form.apiKey) {
        saved = await configApi.updateHermesCLI(form.name, {
          provider: form.provider, model: form.model,
          baseUrl: form.baseUrl, apiMode: form.apiMode,
          soul: form.soul || undefined,
          apiKey: form.apiKey || undefined,
        })
      }
      toastOk('Profile created', `hermes profile ${saved.name} is ready.`)
    } else {
      saved = await configApi.updateHermesCLI(form.name, {
        provider: form.provider, model: form.model,
        baseUrl: form.baseUrl, apiMode: form.apiMode,
        soul: form.soul,
        apiKey: form.apiKey || undefined,
      })
      toastOk('Profile updated', `${saved.name} saved to ~/.hermes.`)
    }

    emit('saved', saved)
    close()
  } catch (err: any) {
    toastErr('Failed', err?.response?.data?.message ?? err?.message ?? 'Something went wrong.')
  } finally {
    saving.value = false
  }
}

function close() { if (!saving.value) emit('update:modelValue', false) }
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
