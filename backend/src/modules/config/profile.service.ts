import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

const PROFILES_PATH = path.join(process.cwd(), 'hermes-profiles.json')

export const SKILL_DEFS: Record<string, { label: string; description: string }> = {
  daily_summary:     { label: 'Daily Summary',     description: 'Generate morning bug digest at 08:00' },
  severity_analysis: { label: 'Severity Analysis',  description: 'Detect severity distribution anomalies' },
  pattern_detection: { label: 'Pattern Detection',  description: 'Surface recurring issue clusters' },
  root_cause:        { label: 'Root Cause',          description: 'Suggest probable root causes per bug' },
  auto_triage:       { label: 'Auto Triage',         description: 'Categorize new tickets automatically' },
  trend_report:      { label: 'Trend Report',        description: 'Weekly issue trend analysis' },
}

export const SOUL_PRESETS: Record<string, { label: string; color: string; soul: string }> = {
  bug_detective: {
    label: 'Bug Detective',
    color: '#6366f1',
    soul: 'You are Hermes, an expert software bug analyst. Your mission is to dissect bug reports with surgical precision. Prioritize by severity and business impact. Identify root causes, detect recurring patterns, and produce concise, actionable reports that development teams can act on immediately. Be direct. No filler.',
  },
  executive: {
    label: 'Executive',
    color: '#0ea5e9',
    soul: 'You are Hermes, a strategic bug analysis agent reporting to executive stakeholders. Translate technical issues into business impact language. Quantify risk. Frame critical bugs as blockers to product goals. Your summaries should be readable in under 2 minutes and drive clear decisions.',
  },
  dev_guide: {
    label: 'Dev Guide',
    color: '#22c55e',
    soul: 'You are Hermes, a senior developer assistant specialized in bug analysis. For each issue cluster, suggest probable root causes, point to likely code areas, and recommend fix strategies. Think in terms of code architecture, edge cases, and technical debt. Be technical. Be specific.',
  },
  qa_auditor: {
    label: 'QA Auditor',
    color: '#f59e0b',
    soul: 'You are Hermes, a quality assurance specialist. Analyze bug reports through the lens of test coverage gaps, regression risk, and release readiness. Identify which bug clusters indicate systemic QA failures. Flag release blockers. Produce structured test-impact reports.',
  },
  custom: {
    label: 'Custom',
    color: '#ec4899',
    soul: '',
  },
}

export interface HermesProfile {
  id: string
  name: string
  description: string
  provider: string
  endpoint: string
  model: string
  apiKey: string
  soul: string
  soulPreset: string
  skills: string[]
  isDefault: boolean
  enabled: boolean
  createdAt: string
  updatedAt: string
}

type SafeProfile = Omit<HermesProfile, 'apiKey'> & { apiKeySet: boolean }

function readProfiles(): HermesProfile[] {
  try { return JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf-8')) }
  catch { return [] }
}

function writeProfiles(profiles: HermesProfile[]): void {
  fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2))
}

function toSafe(p: HermesProfile): SafeProfile {
  const { apiKey, ...rest } = p
  return { ...rest, apiKeySet: !!apiKey }
}

export function getAllProfiles(): SafeProfile[] {
  return readProfiles().map(toSafe)
}

export function getProfileById(id: string): SafeProfile | null {
  const p = readProfiles().find(p => p.id === id)
  return p ? toSafe(p) : null
}

export function createProfile(data: Partial<HermesProfile>): SafeProfile {
  const profiles = readProfiles()
  const now = new Date().toISOString()

  const profile: HermesProfile = {
    id: `profile_${randomUUID().slice(0, 8)}`,
    name: data.name ?? 'Untitled Agent',
    description: data.description ?? '',
    provider: data.provider ?? 'ollama',
    endpoint: data.endpoint ?? 'http://localhost:11434',
    model: data.model ?? '',
    apiKey: data.apiKey ?? '',
    soul: data.soul ?? SOUL_PRESETS.bug_detective.soul,
    soulPreset: data.soulPreset ?? 'bug_detective',
    skills: data.skills ?? ['daily_summary'],
    isDefault: false,
    enabled: data.enabled ?? false,
    createdAt: now,
    updatedAt: now,
  }

  profiles.push(profile)
  writeProfiles(profiles)
  return toSafe(profile)
}

export function updateProfile(id: string, data: Partial<HermesProfile>): SafeProfile | null {
  const profiles = readProfiles()
  const idx = profiles.findIndex(p => p.id === id)
  if (idx < 0) return null

  const existing = profiles[idx]
  profiles[idx] = {
    ...existing,
    ...data,
    id: existing.id,
    apiKey: data.apiKey !== undefined ? data.apiKey : existing.apiKey,
    updatedAt: new Date().toISOString(),
  }

  writeProfiles(profiles)
  return toSafe(profiles[idx])
}

export function deleteProfile(id: string): boolean {
  const profiles = readProfiles()
  const idx = profiles.findIndex(p => p.id === id)
  if (idx < 0) return false
  profiles.splice(idx, 1)
  // ensure at least one default
  if (!profiles.some(p => p.isDefault) && profiles.length > 0) {
    profiles[0].isDefault = true
  }
  writeProfiles(profiles)
  return true
}

export function setDefaultProfile(id: string): SafeProfile | null {
  const profiles = readProfiles()
  const target = profiles.find(p => p.id === id)
  if (!target) return null
  profiles.forEach(p => { p.isDefault = p.id === id })
  writeProfiles(profiles)
  return toSafe(target)
}

export function duplicateProfile(id: string): SafeProfile | null {
  const profiles = readProfiles()
  const src = profiles.find(p => p.id === id)
  if (!src) return null
  return createProfile({ ...src, name: src.name + ' (copy)', isDefault: false, enabled: false })
}

export function getSkillDefs() { return SKILL_DEFS }
export function getSoulPresets() { return SOUL_PRESETS }
