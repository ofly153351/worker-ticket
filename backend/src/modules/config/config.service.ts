import fs from 'fs'
import path from 'path'
import axios from 'axios'

const CONFIG_PATH = path.join(process.cwd(), 'hermes-config.json')

export interface HermesConfig {
  enabled: boolean
  provider: string
  endpoint: string
  model: string
  apiKey: string
}

export interface DiscoveredModel {
  id: string
  name: string
  provider: string
  size?: string
  status: 'online' | 'offline'
}

export interface ProviderInfo {
  id: string
  name: string
  type: 'local' | 'cloud'
  endpoint: string
  status: 'online' | 'offline'
  models: DiscoveredModel[]
  requiresApiKey: boolean
}

export function readConfig(): HermesConfig {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
  } catch {
    return { enabled: false, provider: 'ollama', endpoint: 'http://localhost:11434', model: '', apiKey: '' }
  }
}

export function writeConfig(cfg: HermesConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2))
}

export function getSafeConfig(): Omit<HermesConfig, 'apiKey'> & { apiKeySet: boolean } {
  const cfg = readConfig()
  const { apiKey: _k, ...rest } = cfg
  return { ...rest, apiKeySet: !!_k }
}

async function probeOllama(endpoint = 'http://localhost:11434'): Promise<ProviderInfo> {
  try {
    const res = await axios.get(`${endpoint}/api/tags`, { timeout: 2000 })
    const raw = res.data?.models ?? []
    const models: DiscoveredModel[] = raw.map((m: any) => ({
      id: m.name,
      name: m.name,
      provider: 'ollama',
      size: m.size ? formatBytes(m.size) : undefined,
      status: 'online' as const,
    }))
    return { id: 'ollama', name: 'Ollama', type: 'local', endpoint, status: 'online', models, requiresApiKey: false }
  } catch {
    return { id: 'ollama', name: 'Ollama', type: 'local', endpoint, status: 'offline', models: [], requiresApiKey: false }
  }
}

async function probeLMStudio(endpoint = 'http://localhost:1234'): Promise<ProviderInfo> {
  try {
    const res = await axios.get(`${endpoint}/v1/models`, { timeout: 2000 })
    const raw = res.data?.data ?? []
    const models: DiscoveredModel[] = raw.map((m: any) => ({
      id: m.id,
      name: m.id,
      provider: 'lmstudio',
      status: 'online' as const,
    }))
    return { id: 'lmstudio', name: 'LM Studio', type: 'local', endpoint, status: 'online', models, requiresApiKey: false }
  } catch {
    return { id: 'lmstudio', name: 'LM Studio', type: 'local', endpoint, status: 'offline', models: [], requiresApiKey: false }
  }
}

function cloudProvider(id: string, name: string, models: string[]): ProviderInfo {
  return {
    id, name, type: 'cloud',
    endpoint: id === 'openai' ? 'https://api.openai.com/v1' : id === 'anthropic' ? 'https://api.anthropic.com' : 'https://generativelanguage.googleapis.com',
    status: 'online',
    requiresApiKey: true,
    models: models.map(m => ({ id: m, name: m, provider: id, status: 'online' as const })),
  }
}

export async function discoverProviders(): Promise<ProviderInfo[]> {
  const [ollama, lmstudio] = await Promise.all([probeOllama(), probeLMStudio()])

  return [
    ollama,
    lmstudio,
    cloudProvider('openai', 'OpenAI', ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']),
    cloudProvider('anthropic', 'Anthropic', ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001']),
    cloudProvider('google', 'Google Gemini', ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro']),
  ]
}

function formatBytes(bytes: number): string {
  if (bytes < 1e9) return (bytes / 1e6).toFixed(0) + ' MB'
  return (bytes / 1e9).toFixed(1) + ' GB'
}
