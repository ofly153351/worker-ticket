<template>
  <div class="smooth-fade-up space-y-8">

    <!-- ── Header ──────────────────────────────────────────────────── -->
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Agents</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Hermes CLI profiles from <code class="font-mono text-[12px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">~/.hermes</code>
          · Bug tracker profiles
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="refreshCLI" :disabled="loadingCLI"
          class="flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 dark:text-slate-400 hover:text-brand transition-colors disabled:opacity-40">
          <AppIcon name="refresh" :size="14" :class="loadingCLI ? 'animate-spin' : ''" />
          Refresh
        </button>
        <AppButton variant="secondary" icon="plus" size="sm" @click="openCLICreate">New CLI Profile</AppButton>
        <AppButton icon="plus" size="sm" @click="openCreate">New Profile</AppButton>
      </div>
    </div>

    <!-- ── Hermes CLI profiles ──────────────────────────────────────── -->
    <section class="space-y-3">
      <div class="flex items-center gap-2">
        <h2 class="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Hermes CLI
        </h2>
        <span class="text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
          {{ cliProfiles.length }}
        </span>
      </div>

      <!-- Skeleton -->
      <div v-if="loadingCLI" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <div v-for="i in 5" :key="i" class="h-48 animate-pulse rounded-[16px] bg-slate-100 dark:bg-slate-800/60" />
      </div>

      <!-- CLI profile cards -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <div v-for="(p, i) in cliProfiles" :key="p.name"
          class="relative bg-white dark:bg-slate-900 border-round-lg overflow-hidden flex flex-col smooth-fade-up group"
          :style="{ animationDelay: `${i * 40}ms` }">

          <!-- Status bar top -->
          <div class="h-[3px]"
            :class="p.gatewayState === 'running' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'" />

          <div class="p-4 flex flex-col gap-3 flex-1">
            <!-- Name row -->
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2.5 min-w-0">
                <!-- Provider emoji -->
                <span class="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
                  :style="{ background: providerColor(p.provider) + '18' }">
                  {{ providerEmoji(p.provider) }}
                </span>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <h3 class="font-bold text-slate-800 dark:text-white text-[14px] truncate">
                      {{ p.name }}
                    </h3>
                    <span v-if="p.isDefault"
                      class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-brand text-white shrink-0">
                      ◆
                    </span>
                  </div>
                  <!-- Model + provider -->
                  <div class="flex items-center gap-1 mt-0.5 flex-wrap">
                    <span class="font-mono text-[11px] text-slate-500 dark:text-slate-400">{{ p.model }}</span>
                    <span class="text-slate-300 dark:text-slate-600">·</span>
                    <span class="text-[11px] text-slate-400">{{ p.provider }}</span>
                  </div>
                </div>
              </div>
              <!-- Gateway status -->
              <div class="flex flex-col items-end gap-1 shrink-0">
                <div class="flex items-center gap-1.5">
                  <span :class="['w-1.5 h-1.5 rounded-full',
                    p.gatewayState === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600']" />
                  <span class="text-[11px] font-semibold"
                    :class="p.gatewayState === 'running' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'">
                    {{ p.gatewayState }}
                  </span>
                </div>
                <span v-if="p.activeAgents > 0" class="text-[10px] text-brand font-semibold">
                  {{ p.activeAgents }} active
                </span>
              </div>
            </div>

            <!-- Soul preview -->
            <div v-if="p.soulPreview" class="relative min-h-0">
              <div class="absolute -top-1 left-0 text-slate-200 dark:text-slate-700 text-3xl leading-none font-serif select-none">"</div>
              <p class="pl-4 text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 italic">
                {{ p.soulPreview || 'No soul configured.' }}
              </p>
            </div>

            <!-- Meta + actions row -->
            <div class="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
              <div class="flex items-center gap-3">
                <span class="flex items-center gap-1 text-[11px] text-slate-400">
                  <AppIcon name="sparkle" :size="12" class="text-brand" />
                  {{ p.skillCount }} skills
                </span>
                <div class="flex items-center gap-1">
                  <span v-for="(plat, key) in p.platforms" :key="key"
                    :title="String(key) + ': ' + plat.state"
                    :class="['w-1.5 h-1.5 rounded-full',
                      plat.state === 'connected' ? 'bg-emerald-500'
                      : plat.state === 'retrying' ? 'bg-amber-400'
                      : 'bg-slate-300 dark:bg-slate-600']" />
                </div>
              </div>
              <div class="flex items-center gap-1">
                <button type="button" @click="openCLIEdit(p)"
                  class="h-7 px-2.5 rounded-btn border-round-sm text-[12px] font-semibold text-brand border-brand/30 bg-brand/5 hover:bg-brand/10 transition-colors flex items-center gap-1">
                  <AppIcon name="settings" :size="12" /> Configure
                </button>
                <button v-if="!p.isDefault" type="button" @click="deleteCLI(p)"
                  class="w-7 h-7 rounded-btn border-round-sm flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
                  <AppIcon name="trash" :size="13" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── App Profiles (Hermes bug tracker) ────────────────────────── -->
    <section class="space-y-3">
      <div class="flex items-center gap-2">
        <h2 class="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Bug Tracker Profiles
        </h2>
        <span class="text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
          {{ appProfiles.length }}
        </span>
      </div>

      <div v-if="loadingApp" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <div v-for="i in 3" :key="i" class="h-56 animate-pulse rounded-[16px] bg-slate-100 dark:bg-slate-800/60" />
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <article v-for="(p, i) in appProfiles" :key="p.id"
          class="relative bg-white dark:bg-slate-900 border-round-lg overflow-hidden flex flex-col smooth-fade-up"
          :style="{ animationDelay: `${i * 60}ms` }">

          <div class="h-[3px]" :class="p.isDefault ? 'bg-brand' : 'bg-slate-100 dark:bg-slate-800'" />

          <div class="p-4 flex flex-col gap-3 flex-1">
            <!-- Name row -->
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
                  :style="{ background: soulColor(p.soulPreset) + '18' }">
                  {{ providerEmoji(p.provider) }}
                </span>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <h3 class="font-bold text-slate-800 dark:text-white text-[14px] truncate">{{ p.name }}</h3>
                    <span v-if="p.isDefault" class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand text-white shrink-0">DEFAULT</span>
                  </div>
                  <p class="text-[11px] text-slate-400 truncate mt-0.5">{{ p.description || 'No description' }}</p>
                </div>
              </div>
              <span v-if="p.enabled"
                class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                Active
              </span>
            </div>

            <!-- Model chip -->
            <div class="flex flex-wrap gap-1.5">
              <span class="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-lg">
                {{ providerEmoji(p.provider) }} {{ p.provider }}
              </span>
              <span v-if="p.model" class="font-mono text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                {{ p.model }}
              </span>
            </div>

            <!-- Soul -->
            <div v-if="p.soul" class="relative flex-1">
              <div class="absolute -top-1 left-0 text-slate-200 dark:text-slate-700 text-3xl leading-none font-serif select-none">"</div>
              <p class="pl-4 text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 italic">{{ p.soul }}</p>
              <span v-if="meta?.soulPresets[p.soulPreset]" class="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                :style="{ background: (meta?.soulPresets[p.soulPreset]?.color ?? '#6366f1') + '20', color: meta?.soulPresets[p.soulPreset]?.color }">
                {{ meta?.soulPresets[p.soulPreset]?.label }}
              </span>
            </div>

            <!-- Skills -->
            <div class="flex flex-wrap gap-1">
              <span v-for="sk in p.skills" :key="sk"
                class="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-brand/8 dark:bg-brand/15 text-brand">
                {{ meta?.skills[sk]?.label ?? sk }}
              </span>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 mt-auto">
              <AppButton variant="secondary" size="sm" icon="settings" @click="openEdit(p)" class="flex-1">Configure</AppButton>
              <button v-if="!p.isDefault" type="button" @click="setDefault(p)"
                class="h-8 px-2.5 rounded-btn border-round-sm text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Set default
              </button>
              <button type="button" @click="duplicate(p)"
                class="w-8 h-8 rounded-btn border-round-sm flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <AppIcon name="copy" :size="14" />
              </button>
              <button v-if="!p.isDefault" type="button" @click="remove(p)"
                class="w-8 h-8 rounded-btn border-round-sm flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
                <AppIcon name="trash" :size="14" />
              </button>
            </div>
          </div>
        </article>

        <!-- Add card -->
        <button type="button" @click="openCreate"
          class="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[16px] min-h-[160px] flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-brand hover:text-brand hover:bg-brand/5 transition-all duration-200 group">
          <div class="w-9 h-9 rounded-xl border-2 border-current flex items-center justify-center transition-transform group-hover:scale-110">
            <AppIcon name="plus" :size="18" />
          </div>
          <span class="text-[13px] font-semibold">New profile</span>
        </button>
      </div>
    </section>

    <!-- App profile modal -->
    <ProfileModal
      v-model="modalOpen"
      :profile="editingProfile"
      :providers="providers"
      :meta="meta"
      @saved="loadApp"
    />

    <!-- Hermes CLI modal -->
    <HermesCLIModal
      v-model="cliModalOpen"
      :profile="editingCLIProfile"
      :providers="cliProviders"
      :existing-names="cliProfiles.map(p => p.name)"
      @saved="onCLISaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppButton      from '@/components/ui/AppButton.vue'
import AppIcon        from '@/components/ui/AppIcon.vue'
import ProfileModal   from '@/components/agents/ProfileModal.vue'
import HermesCLIModal from '@/components/agents/HermesCLIModal.vue'
import { configApi, type HermesProfile, type HermesCLIProfile, type HermesProvider, type ProviderInfo, type AgentMeta } from '@/services/config.api'
import { useToast } from '@/composables/useToast'

const { success: toastOk, error: toastErr } = useToast()

const loadingCLI  = ref(true)
const loadingApp  = ref(true)
const cliProfiles = ref<HermesCLIProfile[]>([])
const appProfiles = ref<HermesProfile[]>([])
const providers   = ref<ProviderInfo[]>([])
const cliProviders = ref<HermesProvider[]>([])
const meta        = ref<AgentMeta | null>(null)

const modalOpen      = ref(false)
const editingProfile = ref<HermesProfile | null>(null)

const cliModalOpen      = ref(false)
const editingCLIProfile = ref<HermesCLIProfile | null>(null)

const providerColors: Record<string, string> = {
  'openai-codex': '#10b981', openai: '#10b981', anthropic: '#ec4899',
  deepseek: '#6366f1', google: '#3b82f6', ollama: '#f59e0b', lmstudio: '#8b5cf6',
  'glm': '#0ea5e9', xai: '#e5e7eb', default: '#94a3b8',
}
const providerEmojis: Record<string, string> = {
  'openai-codex': '⚡', openai: '⚡', anthropic: '🔬',
  deepseek: '🌊', google: '✨', ollama: '🦙', lmstudio: '🎛️',
  'glm': '🔷', xai: '👁️', default: '🤖',
}
const soulColors: Record<string, string> = {
  bug_detective: '#6366f1', executive: '#0ea5e9', dev_guide: '#22c55e',
  qa_auditor: '#f59e0b', custom: '#ec4899',
}

function providerColor(p: string) {
  for (const key of Object.keys(providerColors)) { if (p.includes(key)) return providerColors[key] }
  return providerColors.default
}
function providerEmoji(p: string) {
  for (const key of Object.keys(providerEmojis)) { if (p?.includes(key)) return providerEmojis[key] }
  return providerEmojis.default
}
function soulColor(preset: string) { return soulColors[preset] ?? '#6366f1' }

async function refreshCLI() {
  loadingCLI.value = true
  try {
    const [profiles, prov] = await Promise.all([configApi.listHermesCLI(), configApi.getHermesCLIProviders()])
    cliProfiles.value  = profiles
    cliProviders.value = prov
  } finally { loadingCLI.value = false }
}

function openCLICreate() { editingCLIProfile.value = null; cliModalOpen.value = true }
function openCLIEdit(p: HermesCLIProfile) { editingCLIProfile.value = p; cliModalOpen.value = true }

async function onCLISaved() { await refreshCLI() }

async function deleteCLI(p: HermesCLIProfile) {
  if (!confirm(`Delete hermes profile "${p.name}"?\nThis will run: hermes profile delete ${p.name}`)) return
  try {
    await configApi.deleteHermesCLI(p.name)
    await refreshCLI()
    toastOk('Deleted', `Profile ${p.name} removed.`)
  } catch (err: any) {
    toastErr('Failed', err?.response?.data?.message ?? 'Could not delete.')
  }
}

async function loadApp() {
  loadingApp.value = true
  try {
    const [p, prov, m] = await Promise.all([configApi.listProfiles(), configApi.getModels(), configApi.getMeta()])
    appProfiles.value = p
    providers.value   = prov
    meta.value        = m
  } finally { loadingApp.value = false }
}

function openCreate() { editingProfile.value = null; modalOpen.value = true }
function openEdit(p: HermesProfile) { editingProfile.value = p; modalOpen.value = true }

async function setDefault(p: HermesProfile) {
  try { await configApi.setDefault(p.id); await loadApp(); toastOk('Default updated', p.name + ' is now default.') }
  catch { toastErr('Failed', 'Could not set default.') }
}
async function duplicate(p: HermesProfile) {
  try { await configApi.duplicate(p.id); await loadApp(); toastOk('Duplicated', p.name + ' (copy) created.') }
  catch { toastErr('Failed', 'Could not duplicate.') }
}
async function remove(p: HermesProfile) {
  if (!confirm(`Delete "${p.name}"?`)) return
  try { await configApi.deleteProfile(p.id); await loadApp(); toastOk('Deleted', p.name + ' removed.') }
  catch { toastErr('Failed', 'Could not delete.') }
}

onMounted(() => Promise.all([refreshCLI(), loadApp()]))
</script>
