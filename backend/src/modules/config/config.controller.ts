import { Request, Response, NextFunction } from 'express'
import * as service from './config.service'
import * as profileSvc from './profile.service'
import * as hermesCli from './hermes-cli.service'
import { runDailyBugSummary, getNextRuns as getNextRunsJob } from '../agent/daily-summary.job'
import { z } from 'zod'

/* ── Schedule config ─────────────────────────────────────────────── */
export function getSchedule(_req: Request, res: Response, next: NextFunction) {
  try {
    const cfg = service.readConfig() as any
    res.json({ success: true, message: 'Success', data: cfg.schedule ?? {
      profile: 'default', cronExpr: '0 8 * * *', timezone: 'Asia/Bangkok',
      notify: false, notifyTarget: 'telegram',
    }})
  } catch (e) { next(e) }
}

const scheduleSchema = z.object({
  profile:            z.string().optional(),
  cronExpr:           z.string().optional(),
  timezone:           z.string().optional(),
  notify:             z.boolean().optional(),
  notifyTarget:       z.string().optional(),
  discordWebhookUrl:  z.string().optional(),
  telegramTarget:     z.string().optional(),
  notifyMessage:      z.string().optional(),
})

export function putSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const body = scheduleSchema.parse(req.body)
    const cfg = service.readConfig() as any
    cfg.schedule = { ...(cfg.schedule ?? {}), ...body }
    service.writeConfig(cfg)
    res.json({ success: true, message: 'Schedule saved', data: cfg.schedule })
  } catch (e) { next(e) }
}

export async function testNotify(req: Request, res: Response, next: NextFunction) {
  try {
    const { sendNotification } = await import('../agent/hermes.service')
    const cfg = (service.readConfig() as any).schedule ?? {}
    const body = req.body as { webhookUrl?: string; target?: string }
    const webhookUrl = body.webhookUrl || cfg.discordWebhookUrl || ''
    const target = body.target || cfg.notifyTarget || 'discord'

    const testResult = {
      summary_text: '✅ Hermes Bug Tracker connected successfully! Daily summaries will appear here.',
      top_risks: [],
      action_items: [] as any[],
      counts: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
    }
    await sendNotification(testResult, {
      notifyTarget: target,
      discordWebhookUrl: webhookUrl,
      telegramTarget: cfg.telegramTarget,
    }, 'TEST')
    res.json({ success: true, message: 'Test notification sent', data: null })
  } catch (e: any) {
    res.status(400).json({ success: false, message: e?.message ?? 'Failed', errors: [] })
  }
}

export function getNextRuns(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, message: 'Success', data: getNextRunsJob() })
  } catch (e) { next(e) }
}

export async function runNow(_req: Request, res: Response, next: NextFunction) {
  try {
    // Fire-and-forget so the HTTP response returns immediately
    runDailyBugSummary().then(r => console.log('[runNow] Done:', r)).catch(e => console.error('[runNow]', e))
    res.json({ success: true, message: 'Summary job started', data: null })
  } catch (e) { next(e) }
}

/* ── Providers / Models ───────────────────────────────────────────── */
export async function getModels(_req: Request, res: Response, next: NextFunction) {
  try {
    const providers = await service.discoverProviders()
    res.json({ success: true, message: 'Success', data: providers })
  } catch (e) { next(e) }
}

/* ── Hermes global config ─────────────────────────────────────────── */
export function getConfig(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, message: 'Success', data: service.getSafeConfig() })
  } catch (e) { next(e) }
}

// All fields optional — putConfig merges over the current config, so a partial
// update (e.g. just { enabled } from the Live/Mock toggle) is valid.
const configSchema = z.object({
  enabled:  z.boolean().optional(),
  provider: z.string().min(1).optional(),
  endpoint: z.string().optional(),
  model:    z.string().optional(),
  apiKey:   z.string().optional(),
})

export function putConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const body = configSchema.parse(req.body)
    const current = service.readConfig()
    // merge only the keys actually sent (drop undefined) so partial updates don't wipe fields
    const patch = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined))
    service.writeConfig({ ...current, ...patch })
    res.json({ success: true, message: 'Config saved', data: service.getSafeConfig() })
  } catch (e) { next(e) }
}

/* ── Test connection ──────────────────────────────────────────────── */
const testSchema = z.object({
  provider: z.string(),
  endpoint: z.string(),
  model:    z.string(),
  apiKey:   z.string().optional(),
})

export async function testConnection(req: Request, res: Response, next: NextFunction) {
  try {
    const { provider, endpoint, model, apiKey } = testSchema.parse(req.body)
    const axios = (await import('axios')).default

    if (provider === 'ollama') {
      await axios.post(`${endpoint}/api/generate`, { model, prompt: 'ping', stream: false }, { timeout: 5000 })
      res.json({ success: true, message: 'Connected to Ollama', data: { ok: true } })
    } else if (provider === 'lmstudio') {
      await axios.get(`${endpoint}/v1/models`, { timeout: 3000 })
      res.json({ success: true, message: 'Connected to LM Studio', data: { ok: true } })
    } else if (provider === 'openai') {
      await axios.get('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 5000 })
      res.json({ success: true, message: 'OpenAI key valid', data: { ok: true } })
    } else if (provider === 'anthropic') {
      await axios.get('https://api.anthropic.com/v1/models', {
        headers: { 'x-api-key': apiKey!, 'anthropic-version': '2023-06-01' }, timeout: 5000,
      })
      res.json({ success: true, message: 'Anthropic key valid', data: { ok: true } })
    } else {
      res.json({ success: true, message: 'Custom — not verified', data: { ok: false } })
    }
  } catch (err: any) {
    res.status(400).json({ success: false, message: err?.response?.data?.error?.message ?? err?.message ?? 'Connection failed', errors: [] })
  }
}

/* ── Profiles CRUD ────────────────────────────────────────────────── */
export function listProfiles(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, message: 'Success', data: profileSvc.getAllProfiles() })
  } catch (e) { next(e) }
}

export function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const p = profileSvc.getProfileById(req.params['id'] as string)
    if (!p) { res.status(404).json({ success: false, message: 'Profile not found', errors: [] }); return }
    res.json({ success: true, message: 'Success', data: p })
  } catch (e) { next(e) }
}

const profileSchema = z.object({
  name:        z.string().min(1),
  description: z.string().optional(),
  provider:    z.string().min(1),
  endpoint:    z.string().optional(),
  model:       z.string().optional(),
  apiKey:      z.string().optional(),
  soul:        z.string().optional(),
  soulPreset:  z.string().optional(),
  skills:      z.array(z.string()).optional(),
  enabled:     z.boolean().optional(),
})

export function createProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const data = profileSchema.parse(req.body)
    const p = profileSvc.createProfile(data)
    res.status(201).json({ success: true, message: 'Profile created', data: p })
  } catch (e) { next(e) }
}

export function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const data = profileSchema.partial().parse(req.body)
    const p = profileSvc.updateProfile(req.params['id'] as string, data)
    if (!p) { res.status(404).json({ success: false, message: 'Profile not found', errors: [] }); return }
    res.json({ success: true, message: 'Profile updated', data: p })
  } catch (e) { next(e) }
}

export function deleteProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const ok = profileSvc.deleteProfile(req.params['id'] as string)
    if (!ok) { res.status(404).json({ success: false, message: 'Profile not found', errors: [] }); return }
    res.json({ success: true, message: 'Profile deleted', data: null })
  } catch (e) { next(e) }
}

export function setDefault(req: Request, res: Response, next: NextFunction) {
  try {
    const p = profileSvc.setDefaultProfile(req.params['id'] as string)
    if (!p) { res.status(404).json({ success: false, message: 'Profile not found', errors: [] }); return }
    res.json({ success: true, message: 'Default profile set', data: p })
  } catch (e) { next(e) }
}

export function duplicateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const p = profileSvc.duplicateProfile(req.params['id'] as string)
    if (!p) { res.status(404).json({ success: false, message: 'Profile not found', errors: [] }); return }
    res.status(201).json({ success: true, message: 'Profile duplicated', data: p })
  } catch (e) { next(e) }
}

/* ── Hermes CLI profiles ──────────────────────────────────────────── */
export function getHermesCLIProviders(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, message: 'Success', data: hermesCli.getAvailableProviders() })
  } catch (e) { next(e) }
}

export function listHermesCLI(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, message: 'Success', data: hermesCli.listHermesProfiles() })
  } catch (e) { next(e) }
}

export function getHermesCLI(req: Request, res: Response, next: NextFunction) {
  try {
    const p = hermesCli.getHermesProfile(req.params['name'] as string)
    if (!p) { res.status(404).json({ success: false, message: 'Profile not found', errors: [] }); return }
    res.json({ success: true, message: 'Success', data: p })
  } catch (e) { next(e) }
}

const updateCLISchema = z.object({
  provider: z.string().optional(),
  model:    z.string().optional(),
  baseUrl:  z.string().optional(),
  apiMode:  z.string().optional(),
  soul:     z.string().optional(),
  apiKey:   z.string().optional(),
})

export function updateHermesCLI(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = updateCLISchema.parse(req.body)
    const p = hermesCli.updateHermesProfile(req.params['name'] as string, payload)
    res.json({ success: true, message: 'Profile updated', data: p })
  } catch (e) { next(e) }
}

const createCLISchema = z.object({
  name:        z.string().min(1).regex(/^[a-z0-9_-]+$/, 'Lowercase alphanumeric only'),
  description: z.string().optional(),
  cloneFrom:   z.string().optional(),
  noAlias:     z.boolean().optional(),
  noSkills:    z.boolean().optional(),
})

export function createHermesCLI(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = createCLISchema.parse(req.body)
    const p = hermesCli.createHermesProfile(payload)
    res.status(201).json({ success: true, message: 'Profile created', data: p })
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message ?? 'Create failed', errors: [] })
  }
}

export function deleteHermesCLI(req: Request, res: Response, next: NextFunction) {
  try {
    hermesCli.deleteHermesProfile(req.params['name'] as string)
    res.json({ success: true, message: 'Profile deleted', data: null })
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message ?? 'Delete failed', errors: [] })
  }
}

export function getMeta(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({
      success: true, message: 'Success',
      data: { skills: profileSvc.getSkillDefs(), soulPresets: profileSvc.getSoulPresets() },
    })
  } catch (e) { next(e) }
}
