import { api } from './api'

export interface DiscoveredModel {
  id: string; name: string; provider: string; size?: string; status: 'online' | 'offline'
}

export interface ProviderInfo {
  id: string; name: string; type: 'local' | 'cloud'; endpoint: string
  status: 'online' | 'offline'; models: DiscoveredModel[]; requiresApiKey: boolean
}

export interface HermesConfig {
  enabled: boolean; provider: string; endpoint: string; model: string
  apiKey?: string; apiKeySet?: boolean
}

export interface SkillDef {
  label: string; description: string
}

export interface SoulPreset {
  label: string; color: string; soul: string
}

export interface HermesProfile {
  id: string
  name: string
  description: string
  provider: string
  endpoint: string
  model: string
  soul: string
  soulPreset: string
  skills: string[]
  isDefault: boolean
  enabled: boolean
  apiKeySet: boolean
  createdAt: string
  updatedAt: string
}

export interface NextRun {
  projectId: string
  code: string
  name: string
  cronExpr: string
  timezone: string
  nextRun: string | null
  profile: string
  discordConfigured: boolean
}

export interface ScheduleConfig {
  profile: string
  cronExpr: string
  timezone: string
  notify: boolean
  notifyTarget: string
  discordWebhookUrl?: string
  telegramTarget?: string
  notifyMessage?: string
}

export interface AgentMeta {
  skills: Record<string, SkillDef>
  soulPresets: Record<string, SoulPreset>
}

export interface HermesProvider {
  id: string
  label: string
  baseUrl: string
  models: { id: string; name?: string }[]
}

export interface HermesCLIProfile {
  name: string
  isDefault: boolean
  model: string
  provider: string
  baseUrl: string
  gatewayState: 'running' | 'stopped' | string
  activeAgents: number
  alias: string | null
  soul: string
  soulPreview: string
  skillCount: number
  path: string
  platforms: Record<string, { state: string; error_message?: string | null; updated_at?: string }>
}

export const configApi = {
  getModels: () =>
    api.get('/config/models').then(r => r.data as unknown as ProviderInfo[]),

  getHermesCLIProviders: () =>
    api.get('/config/hermes-cli/providers').then(r => r.data as unknown as HermesProvider[]),

  listHermesCLI: () =>
    api.get('/config/hermes-cli').then(r => r.data as unknown as HermesCLIProfile[]),

  getHermesCLI: (name: string) =>
    api.get(`/config/hermes-cli/${name}`).then(r => r.data as unknown as HermesCLIProfile),

  updateHermesCLI: (name: string, payload: { provider?: string; model?: string; baseUrl?: string; apiMode?: string; soul?: string }) =>
    api.put(`/config/hermes-cli/${name}`, payload).then(r => r.data as unknown as HermesCLIProfile),

  createHermesCLI: (payload: { name: string; description?: string; cloneFrom?: string; noAlias?: boolean; noSkills?: boolean }) =>
    api.post('/config/hermes-cli', payload).then(r => r.data as unknown as HermesCLIProfile),

  deleteHermesCLI: (name: string) => api.delete(`/config/hermes-cli/${name}`),

  getMeta: () =>
    api.get('/config/meta').then(r => r.data as unknown as AgentMeta),

  getSchedule: () =>
    api.get('/config/schedule').then(r => r.data as unknown as ScheduleConfig),

  saveSchedule: (s: Partial<ScheduleConfig>) =>
    api.put('/config/schedule', s).then(r => r.data as unknown as ScheduleConfig),

  runNow: () =>
    api.post('/config/schedule/run').then(r => r.data),

  testNotify: (params?: { webhookUrl?: string; target?: string }) =>
    api.post('/config/schedule/test-notify', params ?? {}).then(r => r.data),

  getNextRuns: () =>
    api.get('/config/next-runs').then(r => r.data as unknown as NextRun[]),

  getHermes: () =>
    api.get('/config/hermes').then(r => r.data as unknown as HermesConfig),

  saveHermes: (cfg: Partial<HermesConfig>) =>
    api.put('/config/hermes', cfg).then(r => r.data as unknown as HermesConfig),

  testConnection: (p: { provider: string; endpoint: string; model: string; apiKey?: string }) =>
    api.post('/config/hermes/test', p).then(r => r.data as unknown as { ok: boolean }),

  /* Profiles */
  listProfiles: () =>
    api.get('/config').then(r => r.data as unknown as HermesProfile[]),

  createProfile: (data: Partial<HermesProfile> & { apiKey?: string }) =>
    api.post('/config', data).then(r => r.data as unknown as HermesProfile),

  updateProfile: (id: string, data: Partial<HermesProfile> & { apiKey?: string }) =>
    api.put(`/config/${id}`, data).then(r => r.data as unknown as HermesProfile),

  deleteProfile: (id: string) =>
    api.delete(`/config/${id}`),

  setDefault: (id: string) =>
    api.post(`/config/${id}/default`).then(r => r.data as unknown as HermesProfile),

  duplicate: (id: string) =>
    api.post(`/config/${id}/duplicate`).then(r => r.data as unknown as HermesProfile),
}
