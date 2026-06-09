<template>
  <div class="smooth-fade-up space-y-8">

    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
      <p class="text-slate-500 dark:text-slate-400 mt-1 text-sm">{{ activeTabMeta.subtitle }}</p>
    </div>

    <!-- Tab bar -->
    <div class="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 w-fit sticky top-2 z-20 backdrop-blur">
      <button v-for="t in TABS" :key="t.id" type="button" @click="setTab(t.id)"
        :class="['flex items-center gap-2 px-4 h-9 rounded-lg text-[13px] font-semibold transition-all duration-150',
          activeTab === t.id
            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200']">
        <AppIcon :name="t.icon" :size="15" />
        <span>{{ t.label }}</span>
        <span v-if="t.badge" class="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          :class="activeTab === t.id ? 'bg-brand/10 text-brand' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'">
          {{ t.badge }}
        </span>
      </button>
    </div>

    <!-- Animated tab switch: leave → enter (out-in) so heights don't overlap -->
    <Transition name="tab" mode="out-in">

    <!-- ══════════════ PROFILES TAB ══════════════ -->
    <div v-if="activeTab === 'profiles'" key="profiles" class="space-y-6">

    <!-- Profiles toolbar -->
    <div class="flex items-center justify-end gap-2">
      <button @click="refreshCLI" :disabled="loadingCLI"
        class="flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 dark:text-slate-400 hover:text-brand transition-colors disabled:opacity-40">
        <AppIcon name="refresh" :size="14" :class="loadingCLI ? 'animate-spin' : ''" />
        Refresh
      </button>
      <AppButton variant="secondary" icon="plus" size="sm" @click="openCLICreate">New CLI Profile</AppButton>
      <AppButton icon="plus" size="sm" @click="openCreate">New Profile</AppButton>
    </div>

    <!-- ── Hermes CLI profiles ──────────────────────────────────────── -->
    <section class="space-y-3">
      <div class="flex items-center gap-2">
        <h2 class="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Hermes CLI</h2>
        <span class="text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
          {{ cliProfiles.length }}
        </span>
      </div>

      <div v-if="loadingCLI" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <div v-for="i in 5" :key="i" class="h-48 animate-pulse rounded-[16px] bg-slate-100 dark:bg-slate-800/60" />
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <div v-for="(p, i) in cliProfiles" :key="p.name"
          class="relative bg-white dark:bg-slate-900 border-round-lg overflow-hidden flex flex-col smooth-fade-up"
          :style="{ animationDelay: `${i * 35}ms` }">
          <div class="h-[3px]"
            :class="p.gatewayState === 'running' ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-800'" />
          <div class="p-4 flex flex-col gap-3 flex-1">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
                  :style="{ background: cliProviderColor(p.provider) + '18' }">
                  {{ cliProviderEmoji(p.provider) }}
                </span>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <h3 class="font-bold text-slate-800 dark:text-white text-[14px] truncate">{{ p.name }}</h3>
                    <span v-if="p.isDefault" class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand text-white shrink-0">◆</span>
                  </div>
                  <div class="flex items-center gap-1 mt-0.5 flex-wrap">
                    <span class="font-mono text-[11px] text-slate-500 dark:text-slate-400">{{ p.model }}</span>
                    <span class="text-slate-300 dark:text-slate-600">·</span>
                    <span class="text-[11px] text-slate-400">{{ p.provider }}</span>
                  </div>
                </div>
              </div>
              <div class="flex flex-col items-end gap-1 shrink-0">
                <div class="flex items-center gap-1.5">
                  <span :class="['w-1.5 h-1.5 rounded-full', p.gatewayState === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600']" />
                  <span class="text-[11px] font-semibold"
                    :class="p.gatewayState === 'running' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'">
                    {{ p.gatewayState }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="p.soulPreview" class="relative">
              <div class="absolute -top-1 left-0 text-slate-200 dark:text-slate-700 text-3xl leading-none font-serif select-none">"</div>
              <p class="pl-4 text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 italic">
                {{ p.soulPreview || 'No soul configured.' }}
              </p>
            </div>

            <div class="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
              <div class="flex items-center gap-3">
                <span class="flex items-center gap-1 text-[11px] text-slate-400">
                  <AppIcon name="sparkle" :size="12" class="text-brand" />{{ p.skillCount }} skills
                </span>
                <div class="flex items-center gap-1">
                  <span v-for="(plat, key) in p.platforms" :key="key"
                    :title="String(key) + ': ' + plat.state"
                    :class="['w-1.5 h-1.5 rounded-full', plat.state === 'connected' ? 'bg-emerald-500' : plat.state === 'retrying' ? 'bg-amber-400' : 'bg-slate-300 dark:bg-slate-600']" />
                </div>
              </div>
              <div class="flex items-center gap-1">
                <button type="button" @click="openCLIEdit(p)"
                  class="h-7 px-2.5 rounded-btn border border-brand/30 text-[12px] font-semibold text-brand bg-brand/5 hover:bg-brand/10 transition-colors flex items-center gap-1">
                  <AppIcon name="settings" :size="12" /> Configure
                </button>
                <button v-if="!p.isDefault" type="button" @click="deleteCLI(p)"
                  class="w-7 h-7 rounded-btn flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
                  <AppIcon name="trash" :size="13" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Bug Tracker Profiles ──────────────────────────────────────── -->
    <section class="space-y-3">
      <div class="flex items-center gap-2">
        <h2 class="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Bug Tracker Profiles</h2>
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
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
                  :style="{ background: soulColor(p.soulPreset) + '18' }">
                  {{ cliProviderEmoji(p.provider) }}
                </span>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <h3 class="font-bold text-slate-800 dark:text-white text-[14px] truncate">{{ p.name }}</h3>
                    <span v-if="p.isDefault" class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand text-white shrink-0">DEFAULT</span>
                  </div>
                  <p class="text-[11px] text-slate-400 truncate mt-0.5">{{ p.description || 'No description' }}</p>
                </div>
              </div>
              <span v-if="p.enabled" class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                Active
              </span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span class="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-lg">
                {{ cliProviderEmoji(p.provider) }} {{ p.provider }}
              </span>
              <span v-if="p.model" class="font-mono text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                {{ p.model }}
              </span>
            </div>
            <div v-if="p.soul" class="relative flex-1">
              <div class="absolute -top-1 left-0 text-slate-200 dark:text-slate-700 text-3xl leading-none font-serif select-none">"</div>
              <p class="pl-4 text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 italic">{{ p.soul }}</p>
              <span v-if="meta?.soulPresets[p.soulPreset]" class="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                :style="{ background: (meta?.soulPresets[p.soulPreset]?.color ?? '#6366f1') + '20', color: meta?.soulPresets[p.soulPreset]?.color }">
                {{ meta?.soulPresets[p.soulPreset]?.label }}
              </span>
            </div>
            <div class="flex flex-wrap gap-1">
              <span v-for="sk in p.skills" :key="sk"
                class="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-brand/8 dark:bg-brand/15 text-brand">
                {{ meta?.skills[sk]?.label ?? sk }}
              </span>
            </div>
            <div class="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 mt-auto">
              <AppButton variant="secondary" size="sm" icon="settings" @click="openEdit(p)" class="flex-1">Configure</AppButton>
              <button v-if="!p.isDefault" type="button" @click="setDefault(p)"
                class="h-8 px-2.5 rounded-btn border-round-sm text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Set default
              </button>
              <button type="button" @click="duplicate(p)"
                class="w-8 h-8 rounded-btn flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <AppIcon name="copy" :size="14" />
              </button>
              <button v-if="!p.isDefault" type="button" @click="remove(p)"
                class="w-8 h-8 rounded-btn flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
                <AppIcon name="trash" :size="14" />
              </button>
            </div>
          </div>
        </article>

        <button type="button" @click="openCreate"
          class="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[16px] min-h-[160px] flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-brand hover:text-brand hover:bg-brand/5 transition-all duration-200 group">
          <div class="w-9 h-9 rounded-xl border-2 border-current flex items-center justify-center transition-transform group-hover:scale-110">
            <AppIcon name="plus" :size="18" />
          </div>
          <span class="text-[13px] font-semibold">New profile</span>
        </button>
      </div>
    </section>

    </div>
    <!-- ══════════════ END PROFILES TAB ══════════════ -->

    <!-- ══════════════ SCHEDULE TAB ══════════════ -->
    <div v-else-if="activeTab === 'schedule'" key="schedule" class="space-y-6">

    <!-- ── Schedule ─────────────────────────────────────────────────── -->
    <section class="space-y-3">
      <h2 class="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Daily Summary Schedule</h2>
      <AppCard class="space-y-5">

        <!-- Agent enabled + Run Now row -->
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              :class="agentEnabled ? 'bg-brand/10 text-brand' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'">
              <AppIcon name="sparkle" :size="18" />
            </span>
            <div>
              <div class="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Hermes Agent
                <span v-if="agentEnabled" class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">Live</span>
                <span v-else class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">Mock</span>
              </div>
              <div class="text-[12px] text-slate-400 mt-0.5">
                {{ agentEnabled ? 'Calls hermes CLI for real AI analysis' : 'Using mock summaries (counts only)' }}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <AppButton variant="secondary" size="sm" icon="refresh" :loading="running" @click="triggerNow">
              Run now
            </AppButton>
            <button type="button" role="switch" :aria-checked="agentEnabled"
              @click="toggleAgent"
              :class="['relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                agentEnabled ? 'bg-brand' : 'bg-slate-200 dark:bg-slate-600']">
              <span :class="['pointer-events-none block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200', agentEnabled ? 'translate-x-5' : 'translate-x-0']" />
            </button>
          </div>
        </div>

        <!-- Where config lives now -->
        <div class="flex items-start gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <AppIcon name="projects" :size="16" class="text-brand shrink-0 mt-0.5" />
          <p class="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Each project sets its own <strong>agent profile</strong>, <strong>schedule</strong>,
            <strong>data window</strong>, and <strong>Discord webhook</strong> in
            <RouterLink to="/projects" class="text-brand font-semibold hover:underline">Projects → Edit</RouterLink>.
            The toggle above is the master on/off for all of them.
          </p>
        </div>

        <!-- Last run status -->
        <div v-if="lastRunStatus" class="flex items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span :class="['w-2 h-2 rounded-full shrink-0', lastRunStatus.ok ? 'bg-emerald-500' : 'bg-rose-500']" />
          <span class="text-[12px] text-slate-500 dark:text-slate-400">{{ lastRunStatus.msg }}</span>
        </div>
      </AppCard>

      <!-- Per-project scheduled deliveries -->
      <div class="flex items-center justify-between pt-1">
        <h3 class="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Scheduled Projects
        </h3>
        <span v-if="nextRuns.length" class="text-[11px] text-slate-400">{{ nextRuns.length }} active · counts down locally</span>
      </div>

      <div v-if="nextRuns.length" class="space-y-2">
        <NextRunCountdown v-for="r in nextRuns" :key="r.projectId" :run="r" />
      </div>

      <AppCard v-else class="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 shadow-none">
        <AppIcon name="clock" :size="24" class="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        <p class="text-[13px] font-semibold text-slate-500 dark:text-slate-300">No scheduled projects yet</p>
        <p class="text-[12px] text-slate-400 mt-1">
          Enable a project's daily summary in
          <RouterLink to="/projects" class="text-brand font-semibold hover:underline">Projects → Edit</RouterLink>
        </p>
      </AppCard>
    </section>

    </div>
    <!-- ══════════════ END SCHEDULE TAB ══════════════ -->

    <!-- ══════════════ PREFERENCES TAB ══════════════ -->
    <div v-else key="preferences" class="space-y-6">

    <!-- ── Appearance ──────────────────────────────────────────────── -->
    <section class="space-y-3">
      <h2 class="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Appearance</h2>
      <AppCard>
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-semibold text-slate-700 dark:text-slate-200">Dark mode</div>
            <div class="text-[12px] text-slate-400 mt-0.5">Toggle light / dark theme</div>
          </div>
          <button type="button" role="switch" :aria-checked="isDark" @click="themeToggle"
            :class="['relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
              isDark ? 'bg-brand' : 'bg-slate-200 dark:bg-slate-600']">
            <span :class="['pointer-events-none block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out',
              isDark ? 'translate-x-5' : 'translate-x-0']" />
          </button>
        </div>
      </AppCard>
    </section>

    <!-- ── API ────────────────────────────────────────────────────── -->
    <section class="space-y-3">
      <h2 class="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">API</h2>
      <AppCard>
        <div class="flex items-center justify-between gap-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
          <div class="min-w-0">
            <div class="text-[12px] text-slate-400 font-medium mb-0.5">VITE_API_BASE_URL</div>
            <div class="font-mono text-[13px] text-slate-700 dark:text-slate-200 truncate">{{ apiUrl }}</div>
          </div>
          <span class="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
            <span class="w-2 h-2 rounded-full bg-emerald-500" /> Connected
          </span>
        </div>
      </AppCard>
    </section>

    <!-- ── About ─────────────────────────────────────────────────── -->
    <section class="space-y-3">
      <h2 class="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">About</h2>
      <AppCard class="text-[13px] text-slate-500 dark:text-slate-400 space-y-1">
        <p>Hermes Bug Tracker · v0.1.0</p>
        <p>Powered by <span class="font-semibold text-slate-700 dark:text-slate-200">Vue 3</span> + Express + Prisma + Tailwind CSS</p>
      </AppCard>
    </section>

    </div>
    <!-- ══════════════ END PREFERENCES TAB ══════════════ -->

    </Transition>

    <!-- Modals -->
    <ProfileModal v-model="modalOpen" :profile="editingProfile" :providers="appProviders" :meta="meta" @saved="loadApp" />
    <HermesCLIModal v-model="cliModalOpen" :profile="editingCLIProfile" :providers="cliProviders" :existing-names="cliProfiles.map(p => p.name)" @saved="onCLISaved" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { useToast }  from '@/composables/useToast'
import { configApi, type HermesProfile, type HermesCLIProfile, type HermesProvider, type ProviderInfo, type AgentMeta, type ScheduleConfig, type NextRun } from '@/services/config.api'
import AppCard          from '@/components/ui/AppCard.vue'
import AppButton        from '@/components/ui/AppButton.vue'
import AppIcon          from '@/components/ui/AppIcon.vue'
import ProfileModal     from '@/components/agents/ProfileModal.vue'
import HermesCLIModal   from '@/components/agents/HermesCLIModal.vue'
import NextRunCountdown from '@/components/agents/NextRunCountdown.vue'

const { isDark, toggle: themeToggle } = useTheme()
const { success: toastOk, error: toastErr } = useToast()
const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

/* ── State ───────────────────────────────────────────────────────── */
const loadingCLI  = ref(true)
const loadingApp  = ref(true)
const cliProfiles  = ref<HermesCLIProfile[]>([])
const appProfiles  = ref<HermesProfile[]>([])
const appProviders = ref<ProviderInfo[]>([])
const cliProviders = ref<HermesProvider[]>([])
const meta         = ref<AgentMeta | null>(null)

const modalOpen      = ref(false)
const editingProfile = ref<HermesProfile | null>(null)
const cliModalOpen      = ref(false)
const editingCLIProfile = ref<HermesCLIProfile | null>(null)

/* ── Schedule ─────────────────────────────────────────────────────── */
const agentEnabled   = ref(false)
const running        = ref(false)
const testingNotify  = ref(false)
const nextRuns       = ref<NextRun[]>([])

/* ── Tabs ─────────────────────────────────────────────────────────── */
type TabId = 'schedule' | 'profiles' | 'preferences'
const activeTab = ref<TabId>(
  (localStorage.getItem('settings-tab') as TabId) || 'schedule'
)
function setTab(id: TabId) {
  activeTab.value = id
  localStorage.setItem('settings-tab', id)
}

const TABS = computed(() => [
  { id: 'schedule'    as const, label: 'Schedule',    icon: 'clock',
    badge: nextRuns.value.length || '' },
  { id: 'profiles'    as const, label: 'Agents',      icon: 'agent',
    badge: cliProfiles.value.length + appProfiles.value.length || '' },
  { id: 'preferences' as const, label: 'Preferences', icon: 'settings', badge: '' },
])

const activeTabMeta = computed(() => {
  switch (activeTab.value) {
    case 'schedule':    return { subtitle: 'Daily summary cron, Discord delivery, and live countdowns' }
    case 'profiles':    return { subtitle: 'Hermes CLI profiles and bug-tracker agent presets' }
    case 'preferences': return { subtitle: 'Appearance, API connection, and about' }
  }
})
const lastRunStatus  = ref<{ ok: boolean; msg: string } | null>(null)
const testNotifyResult = ref<{ ok: boolean; msg: string } | null>(null)

const schedule = reactive<ScheduleConfig>({
  profile: 'default', cronExpr: '0 8 * * *',
  timezone: 'Asia/Bangkok', notify: false,
  notifyTarget: 'discord', discordWebhookUrl: '', telegramTarget: 'telegram',
})

const notifyTargets = [
  { id: 'telegram', label: 'Telegram', emoji: '✈️' },
  { id: 'discord',  label: 'Discord',  emoji: '💬' },
]

const cronLabel = computed(() => {
  const parts = schedule.cronExpr?.split(' ') ?? []
  if (parts.length >= 2) {
    const h = parts[1], m = parts[0]
    if (!isNaN(Number(h)) && !isNaN(Number(m))) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
  }
  return schedule.cronExpr
})

async function toggleAgent() {
  agentEnabled.value = !agentEnabled.value
  try {
    await configApi.saveHermes({ enabled: agentEnabled.value })
    toastOk(
      agentEnabled.value ? 'Agent enabled' : 'Agent disabled',
      agentEnabled.value ? 'Hermes CLI will run on next summary.' : 'Using mock summaries.'
    )
  } catch { agentEnabled.value = !agentEnabled.value }
}

async function saveSchedule() {
  try {
    await configApi.saveSchedule({ ...schedule })
    // cron expr / timezone may have changed → refresh next-run times
    await refreshNextRuns()
  } catch {}
}

async function refreshNextRuns() {
  try { nextRuns.value = await configApi.getNextRuns() } catch {}
}

async function testNotify() {
  testingNotify.value = true
  testNotifyResult.value = null
  try {
    await configApi.testNotify({
      target: schedule.notifyTarget,
      webhookUrl: schedule.discordWebhookUrl,
    })
    testNotifyResult.value = { ok: true, msg: '✓ Sent successfully' }
    toastOk('Test sent', 'Check your Discord channel.')
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? 'Failed to send'
    testNotifyResult.value = { ok: false, msg }
    toastErr('Test failed', msg)
  } finally {
    testingNotify.value = false
  }
}

async function triggerNow() {
  running.value = true
  lastRunStatus.value = null
  try {
    await configApi.runNow()
    lastRunStatus.value = { ok: true, msg: 'Job started — summary will appear in Daily Summary page shortly.' }
    toastOk('Running', 'Daily summary job started.')
  } catch (err: any) {
    lastRunStatus.value = { ok: false, msg: err?.response?.data?.message ?? 'Failed to start job.' }
    toastErr('Failed', lastRunStatus.value.msg)
  } finally {
    running.value = false
  }
}

/* ── Provider helpers ─────────────────────────────────────────────── */
const PROVIDER_EMOJIS: Record<string, string> = {
  anthropic: '🔬', openai: '⚡', 'openai-codex': '⚡', deepseek: '🌊',
  'opencode-go': '🧬', ollama: '🦙', lmstudio: '🎛️', groq: '⚡', mistral: '🇫🇷',
}
const PROVIDER_COLORS: Record<string, string> = {
  anthropic: '#ec4899', openai: '#10b981', 'openai-codex': '#10b981', deepseek: '#6366f1',
  'opencode-go': '#a78bfa', ollama: '#f59e0b', lmstudio: '#8b5cf6',
}
const SOUL_COLORS: Record<string, string> = {
  bug_detective: '#6366f1', executive: '#0ea5e9', dev_guide: '#22c55e', qa_auditor: '#f59e0b', custom: '#ec4899',
}

function cliProviderEmoji(p: string) {
  for (const k of Object.keys(PROVIDER_EMOJIS)) { if (p?.includes(k)) return PROVIDER_EMOJIS[k] }
  return '🤖'
}
function cliProviderColor(p: string) {
  for (const k of Object.keys(PROVIDER_COLORS)) { if (p?.includes(k)) return PROVIDER_COLORS[k] }
  return '#94a3b8'
}
function soulColor(preset: string) { return SOUL_COLORS[preset] ?? '#6366f1' }

/* ── Data loading ─────────────────────────────────────────────────── */
async function refreshCLI() {
  loadingCLI.value = true
  try {
    const [profiles, prov] = await Promise.all([configApi.listHermesCLI(), configApi.getHermesCLIProviders()])
    cliProfiles.value  = profiles
    cliProviders.value = prov
  } finally { loadingCLI.value = false }
}

async function loadApp() {
  loadingApp.value = true
  try {
    const [p, prov, m] = await Promise.all([configApi.listProfiles(), configApi.getModels(), configApi.getMeta()])
    appProfiles.value  = p
    appProviders.value = prov
    meta.value         = m
  } finally { loadingApp.value = false }
}

/* ── CLI profile actions ─────────────────────────────────────────── */
function openCLICreate() { editingCLIProfile.value = null; cliModalOpen.value = true }
function openCLIEdit(p: HermesCLIProfile) { editingCLIProfile.value = p; cliModalOpen.value = true }
async function onCLISaved() { await refreshCLI() }

async function deleteCLI(p: HermesCLIProfile) {
  if (!confirm(`Delete hermes profile "${p.name}"?`)) return
  try { await configApi.deleteHermesCLI(p.name); await refreshCLI(); toastOk('Deleted', p.name + ' removed.') }
  catch (err: any) { toastErr('Failed', err?.response?.data?.message ?? 'Could not delete.') }
}

/* ── App profile actions ─────────────────────────────────────────── */
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

let resyncTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await Promise.all([refreshCLI(), loadApp()])
  try {
    const [s, h] = await Promise.all([configApi.getSchedule(), configApi.getHermes()])
    Object.assign(schedule, s)
    agentEnabled.value = h.enabled ?? false
  } catch {}
  await refreshNextRuns()
  // Re-sync next-run times every 5 min (after a cron fires the target rolls forward)
  resyncTimer = setInterval(refreshNextRuns, 5 * 60 * 1000)
})

onUnmounted(() => {
  if (resyncTimer) clearInterval(resyncTimer)
})
</script>

<style scoped>
/* Tab switch — snappy fade+slide. out-in: old leaves, then new enters
   (no overlap → no layout jump between tabs of different heights). */
.tab-enter-active { transition: opacity 0.18s ease-out, transform 0.18s ease-out; }
.tab-leave-active { transition: opacity 0.10s ease-in,  transform 0.10s ease-in; }
.tab-enter-from   { opacity: 0; transform: translateY(8px); }
.tab-leave-to     { opacity: 0; transform: translateY(-6px); }

@media (prefers-reduced-motion: reduce) {
  .tab-enter-active, .tab-leave-active { transition: none; }
  .tab-enter-from, .tab-leave-to { transform: none; }
}
</style>
