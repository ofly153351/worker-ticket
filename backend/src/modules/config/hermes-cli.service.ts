import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import os from 'os'
import { execSync } from 'child_process'

const HERMES_HOME = path.join(os.homedir(), '.hermes')
const PROFILES_DIR = path.join(HERMES_HOME, 'profiles')
const HERMES_BIN = path.join(os.homedir(), '.local', 'bin', 'hermes')

export interface HermesCLIProfile {
  name: string
  isDefault: boolean
  model: string
  provider: string
  baseUrl: string
  apiMode: string
  gatewayState: string
  activeAgents: number
  alias: string | null
  soul: string
  soulPreview: string
  skillCount: number
  path: string
  platforms: Record<string, { state: string; error_message?: string | null; updated_at?: string }>
}

export interface ProviderModel { id: string; name?: string }
export interface HermesProvider {
  id: string
  label: string
  baseUrl: string
  models: ProviderModel[]
}

/* ── Provider base URL map ───────────────────────────────────────── */
const PROVIDER_BASE_URLS: Record<string, string> = {
  'anthropic':    'https://api.anthropic.com',
  'openai':       'https://api.openai.com/v1',
  'openai-codex': 'https://chatgpt.com/backend-api/codex',
  'deepseek':     'https://api.deepseek.com/v1',
  'opencode-go':  'https://opencode.ai/zen/go/v1',
  'ollama':       'http://localhost:11434/v1',
  'lmstudio':     'http://localhost:1234/v1',
  'groq':         'https://api.groq.com/openai/v1',
  'mistral':      'https://api.mistral.ai/v1',
  'together':     'https://api.together.xyz/v1',
}

const PROVIDER_LABELS: Record<string, string> = {
  'anthropic':    'Anthropic',
  'openai':       'OpenAI',
  'openai-codex': 'OpenAI Codex',
  'deepseek':     'DeepSeek',
  'opencode-go':  'OpenCode',
  'ollama':       'Ollama',
  'lmstudio':     'LM Studio',
  'groq':         'Groq',
  'mistral':      'Mistral',
  'together':     'Together AI',
}

/* ── Read providers from hermes cache ───────────────────────────── */
export function getAvailableProviders(): HermesProvider[] {
  const providers: HermesProvider[] = []
  const cachePath = path.join(HERMES_HOME, 'provider_models_cache.json')

  try {
    const cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'))
    for (const [id, data] of Object.entries(cache as Record<string, any>)) {
      const rawModels: any[] = data.models ?? []
      const models: ProviderModel[] = rawModels.map(m =>
        typeof m === 'string' ? { id: m } : { id: m.id ?? m.name, name: m.name }
      )
      providers.push({
        id,
        label: PROVIDER_LABELS[id] ?? id,
        baseUrl: data.base_url ?? PROVIDER_BASE_URLS[id] ?? '',
        models,
      })
    }
  } catch {}

  // Always add ollama + lmstudio even if not in cache
  const existingIds = providers.map(p => p.id)
  if (!existingIds.includes('ollama')) {
    providers.push({ id: 'ollama', label: 'Ollama', baseUrl: 'http://localhost:11434/v1', models: [] })
  }
  if (!existingIds.includes('lmstudio')) {
    providers.push({ id: 'lmstudio', label: 'LM Studio', baseUrl: 'http://localhost:1234/v1', models: [] })
  }

  return providers
}

/* ── Profile helpers ─────────────────────────────────────────────── */
function profileDir(name: string): string {
  return name === 'default' ? HERMES_HOME : path.join(PROFILES_DIR, name)
}

function readYaml(filePath: string): any {
  try { return yaml.load(fs.readFileSync(filePath, 'utf-8')) ?? {} }
  catch { return {} }
}

function readGatewayState(dir: string) {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(dir, 'gateway_state.json'), 'utf-8'))
    return { state: raw.gateway_state ?? 'stopped', activeAgents: raw.active_agents ?? 0, platforms: raw.platforms ?? {} }
  } catch { return { state: 'stopped', activeAgents: 0, platforms: {} } }
}

function readSoul(dir: string): string {
  try {
    return fs.readFileSync(path.join(dir, 'SOUL.md'), 'utf-8')
      .replace(/<!--[\s\S]*?-->/g, '').trim()
  } catch { return '' }
}

function countSkills(dir: string): number {
  try {
    const sd = path.join(dir, 'skills')
    return fs.existsSync(sd) ? fs.readdirSync(sd).length : 0
  } catch { return 0 }
}

function resolveAlias(name: string): string | null {
  const p = path.join(os.homedir(), '.local', 'bin', name)
  return fs.existsSync(p) ? p : null
}

function parseProfile(dir: string, name: string, isDefault: boolean): HermesCLIProfile {
  const cfg = readYaml(path.join(dir, 'config.yaml'))
  const gw = readGatewayState(dir)
  const soul = readSoul(dir)
  return {
    name, isDefault,
    model: cfg?.model?.default ?? '—',
    provider: cfg?.model?.provider ?? '—',
    baseUrl: cfg?.model?.base_url ?? PROVIDER_BASE_URLS[cfg?.model?.provider] ?? '',
    apiMode: cfg?.model?.api_mode ?? 'chat_completions',
    gatewayState: gw.state,
    activeAgents: gw.activeAgents,
    alias: isDefault ? null : resolveAlias(name),
    soul,
    soulPreview: soul.slice(0, 220).replace(/\n+/g, ' '),
    skillCount: countSkills(dir),
    path: dir,
    platforms: gw.platforms,
  }
}

export function listHermesProfiles(): HermesCLIProfile[] {
  const profiles: HermesCLIProfile[] = []
  if (fs.existsSync(HERMES_HOME)) profiles.push(parseProfile(HERMES_HOME, 'default', true))
  if (fs.existsSync(PROFILES_DIR)) {
    for (const entry of fs.readdirSync(PROFILES_DIR, { withFileTypes: true })) {
      if (entry.isDirectory()) profiles.push(parseProfile(path.join(PROFILES_DIR, entry.name), entry.name, false))
    }
  }
  return profiles
}

export function getHermesProfile(name: string): HermesCLIProfile | null {
  const dir = profileDir(name)
  return fs.existsSync(dir) ? parseProfile(dir, name, name === 'default') : null
}

/* ── Update profile config ───────────────────────────────────────── */
export interface UpdateProfilePayload {
  provider?: string
  model?: string
  baseUrl?: string
  apiMode?: string
  soul?: string
}

export function updateHermesProfile(name: string, payload: UpdateProfilePayload): HermesCLIProfile {
  const dir = profileDir(name)
  if (!fs.existsSync(dir)) throw new Error(`Profile "${name}" not found`)

  const configPath = path.join(dir, 'config.yaml')
  const cfg: any = readYaml(configPath)

  if (!cfg.model) cfg.model = {}
  if (payload.provider !== undefined) cfg.model.provider = payload.provider
  if (payload.model    !== undefined) cfg.model.default  = payload.model
  if (payload.baseUrl  !== undefined) cfg.model.base_url = payload.baseUrl
  if (payload.apiMode  !== undefined) cfg.model.api_mode = payload.apiMode

  // auto-fill base_url from known providers if blank
  if (!cfg.model.base_url && cfg.model.provider && PROVIDER_BASE_URLS[cfg.model.provider]) {
    cfg.model.base_url = PROVIDER_BASE_URLS[cfg.model.provider]
  }

  fs.writeFileSync(configPath, yaml.dump(cfg, { lineWidth: 120 }))

  if (payload.soul !== undefined) {
    const soulPath = path.join(dir, 'SOUL.md')
    fs.writeFileSync(soulPath, payload.soul)
  }

  return parseProfile(dir, name, name === 'default')
}

/* ── Create profile via hermes CLI ──────────────────────────────── */
export interface CreateProfilePayload {
  name: string
  description?: string
  cloneFrom?: string
  noAlias?: boolean
  noSkills?: boolean
}

export function createHermesProfile(payload: CreateProfilePayload): HermesCLIProfile {
  const { name, description, cloneFrom, noAlias, noSkills } = payload

  if (!/^[a-z0-9_-]+$/.test(name)) throw new Error('Profile name must be lowercase alphanumeric (a-z 0-9 _ -)')

  const existingDir = path.join(PROFILES_DIR, name)
  if (fs.existsSync(existingDir)) throw new Error(`Profile "${name}" already exists`)

  let cmd = `${HERMES_BIN} profile create ${name}`
  if (description) cmd += ` --description "${description.replace(/"/g, '\\"')}"`
  if (cloneFrom)   cmd += ` --clone-from ${cloneFrom}`
  else if (!noSkills) cmd += ''  // default behavior
  if (noAlias)     cmd += ' --no-alias'
  if (noSkills)    cmd += ' --no-skills'

  execSync(cmd, { encoding: 'utf-8', timeout: 30000 })

  const dir = path.join(PROFILES_DIR, name)
  if (!fs.existsSync(dir)) throw new Error('Profile created but directory not found')

  return parseProfile(dir, name, false)
}

/* ── Delete profile via hermes CLI ──────────────────────────────── */
export function deleteHermesProfile(name: string): void {
  if (name === 'default') throw new Error('Cannot delete the default profile')
  execSync(`${HERMES_BIN} profile delete ${name} --yes 2>/dev/null || true`, { encoding: 'utf-8', timeout: 10000 })
}
