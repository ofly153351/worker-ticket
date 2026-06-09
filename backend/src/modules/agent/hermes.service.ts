import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawn } from 'child_process'
import { env } from '../../config/env'
import { Ticket, Project } from '@prisma/client'

// Resolve the hermes CLI: explicit env override → common install paths → PATH.
// PM2 often runs with a minimal PATH, so prefer an absolute path when we find one.
function resolveHermesBin(): string {
  if (process.env.HERMES_BIN) return process.env.HERMES_BIN
  const candidates = [
    path.join(os.homedir(), '.local', 'bin', 'hermes'),
    '/root/.local/bin/hermes',
    '/usr/local/bin/hermes',
    '/usr/bin/hermes',
  ]
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c } catch {}
  }
  return 'hermes' // last resort: rely on PATH
}
const HERMES_BIN = resolveHermesBin()
console.log(`[Hermes] CLI binary: ${HERMES_BIN}`)

interface TicketWithProject extends Ticket { project: Project }

export interface ActionItem {
  problem: string
  solution: string
  owner: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  done: boolean
}

export interface HermesResult {
  summary_text: string
  top_risks?: string[]
  action_items: ActionItem[]
}

/* ── Structured payload (what we hand to the agent) ─────────────── */
export interface AgentPayload {
  project: {
    id: string; name: string; code: string; status: string
    design_context?: string
  }
  scope: string   // human label for which tickets were selected
  generated_at: string
  counts: { total: number; critical: number; high: number; medium: number; low: number }
  open_count: number
  in_progress_count: number
  tickets: Array<{
    id: string; title: string; description: string
    severity: string; status: string; reporter: string
    page_url: string | null; browser_info: string | null
    created_at: string
  }>
}

export function buildPayload(
  tickets: TicketWithProject[],
  project: Project,
  scope = 'Outstanding tickets (open + in progress)'
): AgentPayload {
  let design_context: string | undefined
  if ((project as any).design_context_path) {
    try { design_context = fs.readFileSync((project as any).design_context_path, 'utf-8') } catch {}
  }

  return {
    project: {
      id: project.id, name: project.name, code: project.code,
      status: (project as any).status,
      ...(design_context ? { design_context } : {}),
    },
    scope,
    generated_at: new Date().toISOString(),
    counts: {
      total:    tickets.length,
      critical: tickets.filter(t => t.severity === 'critical').length,
      high:     tickets.filter(t => t.severity === 'high').length,
      medium:   tickets.filter(t => t.severity === 'medium').length,
      low:      tickets.filter(t => t.severity === 'low').length,
    },
    open_count:        tickets.filter(t => t.status === 'open').length,
    in_progress_count: tickets.filter(t => t.status === 'in_progress').length,
    tickets: tickets.map(t => ({
      id: t.id, title: t.title,
      description: t.description, // full description — no truncation
      severity: t.severity, status: t.status,
      reporter: t.reporter_name,
      page_url: t.page_url ?? null,
      browser_info: t.browser_info ?? null,
      created_at: t.created_at.toISOString(),
    })),
  }
}

/* ── Prompt built from structured payload ─────────────────────────── */
export function buildPromptFromPayload(payload: AgentPayload, soul?: string): string {
  const { project, counts, tickets, scope } = payload

  const ticketList = tickets
    .sort((a, b) => {
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
      return (order[a.severity] ?? 9) - (order[b.severity] ?? 9)
    })
    .map(t =>
      `[${t.severity.toUpperCase()}][${t.status}] ${t.title}\n` +
      `  desc: ${t.description}\n` +
      (t.page_url ? `  url: ${t.page_url}\n` : '') +
      (t.browser_info ? `  browser: ${t.browser_info}` : '')
    ).join('\n\n')

  const designBlock = project.design_context
    ? `\n## Design Context\n${project.design_context.slice(0, 1000)}\n`
    : ''

  return `${soul ? soul + '\n\n---\n\n' : ''}## Bug Analysis Request

**Project:** ${project.name} (${project.code})
**Scope:** ${scope}  |  Generated: ${payload.generated_at}
${designBlock}
## Ticket Summary
Total: ${counts.total}  |  Critical: ${counts.critical}  |  High: ${counts.high}  |  Medium: ${counts.medium}  |  Low: ${counts.low}
Open: ${payload.open_count}  |  In Progress: ${payload.in_progress_count}

## Tickets
${ticketList || '(no outstanding tickets)'}

## Instructions
Analyze these tickets and return ONLY valid JSON with no markdown.
เขียนเนื้อหาทุกค่า (summary_text, top_risks, problem, solution) เป็น **ภาษาไทย**
ยกเว้น code, error message, ชื่อ field/function, URL และ technical term ที่คงภาษาอังกฤษ
ค่า "owner" และ "priority" ให้คงเป็น enum อังกฤษตามด้านล่าง
{
  "summary_text": "สรุป 2-3 ประโยค (ภาษาไทย): สถานะรวม, การกระจาย severity, ผลกระทบต่อผู้ใช้",
  "top_risks": ["ความเสี่ยงสั้นๆ (ภาษาไทย)", "..."],
  "action_items": [
    {
      "problem": "ปัญหา/บั๊กที่เจาะจง (ภาษาไทย)",
      "solution": "วิธีแก้เชิงเทคนิคที่ทำได้จริง (ภาษาไทย)",
      "owner": "Frontend Dev | Backend Dev | Tech Lead | QA | DevOps",
      "priority": "critical | high | medium | low",
      "done": false
    }
  ]
}`
}

/* ── Preview: return payload + prompt without running agent ──────── */
export function previewPayload(
  tickets: TicketWithProject[],
  project: Project,
  scope?: string,
  soul?: string
): { payload: AgentPayload; prompt: string } {
  const payload = buildPayload(tickets, project, scope)
  const prompt  = buildPromptFromPayload(payload, soul)
  return { payload, prompt }
}

/* ── Extract JSON from LLM output ───────────────────────────────── */
function extractJson(raw: string): HermesResult | null {
  try { return JSON.parse(raw.trim()) } catch {}
  const block = raw.match(/```(?:json)?\s*([\s\S]+?)```/)
  if (block) { try { return JSON.parse(block[1].trim()) } catch {} }
  const match = raw.match(/\{[\s\S]+\}/)
  if (match) { try { return JSON.parse(match[0]) } catch {} }
  return null
}

// hermes is a Python CLI that needs python + its deps on PATH and HOME set to find
// ~/.hermes. PM2 spawns with a minimal env, so we rebuild a full PATH/HOME here —
// this is why `hermes` works in an interactive shell but fails when spawned by PM2.
function hermesEnv(): NodeJS.ProcessEnv {
  const home = process.env.HOME || os.homedir()
  const extraPaths = ['/usr/local/bin', '/usr/bin', '/bin', `${home}/.local/bin`]
  const existing = (process.env.PATH || '').split(':').filter(Boolean)
  const PATH = [...new Set([...extraPaths, ...existing])].join(':')
  return { ...process.env, HOME: home, PATH }
}

/* ── Run hermes CLI ─────────────────────────────────────────────── */
function runHermesCLI(prompt: string, profile: string, timeoutMs = 180_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(HERMES_BIN, ['--profile', profile, '-z', prompt, '--yolo'], {
      env: hermesEnv(),
      timeout: timeoutMs,
    })
    let stdout = '', stderr = ''
    child.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
    child.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
    child.on('close', (code) => {
      if (code === 0) resolve(stdout.trim())
      else reject(new Error(`hermes exited ${code}: ${stderr.slice(0, 300)}`))
    })
    child.on('error', reject)
  })
}

/* ── Notification ───────────────────────────────────────────────── */
const PRIORITY_EMOJI: Record<string, string> = {
  critical: '🔴', high: '🟠', medium: '🔵', low: '⚫',
}
const PRIORITY_COLOR: Record<string, number> = {
  critical: 0xef4444, high: 0xf97316, medium: 0x3b82f6, low: 0x6366f1,
}

export async function sendDiscordWebhook(
  result: HermesResult & { counts?: Record<string, number>; scope?: string },
  webhookUrl: string,
  projectCode?: string,
  projectName?: string,
  date?: string
): Promise<void> {
  const axios = (await import('axios')).default
  const { counts, scope, top_risks = [], action_items = [] } = result

  // Determine embed color by highest severity with tickets
  const topSeverity = counts?.critical ? 'critical' : counts?.high ? 'high' : counts?.medium ? 'medium' : 'low'
  const color = PRIORITY_COLOR[topSeverity] ?? 0x6366f1

  // ── Field: Severity breakdown ──────────────────────────────────
  const sevField = counts ? {
    name: '📊 Severity Breakdown',
    value: [
      `🔴 **Critical:** ${counts.critical}`,
      `🟠 **High:** ${counts.high}`,
      `🔵 **Medium:** ${counts.medium}`,
      `⚫ **Low:** ${counts.low}`,
    ].join('　'),
  } : null

  // ── Field: Top risks ───────────────────────────────────────────
  const risksField = top_risks.length ? {
    name: '⚠️ Top Risks',
    value: top_risks.slice(0, 4).map(r => `› ${r}`).join('\n'),
  } : null

  // ── Fields: Action items grouped by priority ───────────────────
  const byPriority: Record<string, ActionItem[]> = {
    critical: [], high: [], medium: [], low: [],
  }
  for (const a of action_items) {
    const p = a.priority ?? 'medium'
    ;(byPriority[p] ??= []).push(a)
  }

  const actionFields: { name: string; value: string }[] = []
  for (const prio of ['critical', 'high', 'medium', 'low'] as const) {
    const items = byPriority[prio]
    if (!items?.length) continue
    const lines = items.map(a =>
      `${PRIORITY_EMOJI[prio]} **${a.problem}**\n` +
      `　↳ ${a.solution}\n` +
      `　*— ${a.owner}*`
    ).join('\n\n')
    actionFields.push({
      name: `${PRIORITY_EMOJI[prio]} ${prio.charAt(0).toUpperCase() + prio.slice(1)} Priority Actions`,
      value: lines.slice(0, 1020),
    })
  }

  const fields = [
    ...(sevField ? [sevField] : []),
    ...(risksField ? [risksField] : []),
    ...actionFields,
  ].slice(0, 10) // Discord max 10 fields

  const footerParts = [
    'Hermes Bug Tracker',
    projectCode ? `Project: ${projectCode}` : '',
    scope || 'Outstanding tickets',
  ].filter(Boolean).join(' · ')

  const embed = {
    title: `🐞 Daily Bug Digest${projectCode ? ` · ${projectCode}` : ''}`,
    description: result.summary_text.slice(0, 2000) || '_No summary available_',
    color,
    fields,
    footer: { text: footerParts },
    timestamp: new Date().toISOString(),
  }

  await axios.post(webhookUrl, { embeds: [embed] }, { timeout: 10_000 })
}

export async function sendTelegram(message: string, target = 'telegram'): Promise<void> {
  return new Promise((resolve) => {
    const child = spawn(HERMES_BIN, ['send', '-t', target, message], {
      env: hermesEnv(), timeout: 20_000,
    })
    child.on('close', () => resolve())
    child.on('error', () => resolve())
  })
}

/** Route to the right channel based on schedule config */
export async function sendNotification(
  result: HermesResult & { counts?: Record<string, number>; scope?: string },
  config: { notifyTarget?: string; discordWebhookUrl?: string; telegramTarget?: string },
  projectCode?: string,
  projectName?: string,
  date?: string
): Promise<void> {
  const target = config.notifyTarget ?? 'telegram'

  if (target === 'discord') {
    if (!config.discordWebhookUrl) {
      console.warn(`[Notify:${projectCode ?? '?'}] target=discord แต่ไม่มี webhook URL — ไม่ส่ง (ตั้งใน Project หรือ Settings)`)
      return
    }
    console.log(`[Notify:${projectCode ?? '?'}] → Discord webhook`)
    await sendDiscordWebhook(result, config.discordWebhookUrl, projectCode, projectName, date)
    return
  }

  // Telegram: plain text format (requires hermes CLI on the host)
  console.log(`[Notify:${projectCode ?? '?'}] → Telegram (${config.telegramTarget ?? 'telegram'})`)
  const counts = result.counts
  const sevLine = counts
    ? `🔴 ${counts.critical} critical  🟠 ${counts.high} high  🔵 ${counts.medium} medium  ⚫ ${counts.low} low`
    : ''
  const actions = (result.action_items ?? []).slice(0, 5)
    .map(a => `• ${a.problem} → ${a.solution} *(${a.owner})*`).join('\n')
  const msg = [
    `🐞 *Bug Digest${projectCode ? ` · ${projectCode}` : ''}*`,
    date ? `_${date}_` : '',
    '',
    result.summary_text.slice(0, 800),
    sevLine ? `\n${sevLine}` : '',
    actions ? `\n*Action Items:*\n${actions}` : '',
  ].filter(Boolean).join('\n')

  await sendTelegram(msg, config.telegramTarget ?? 'telegram')
}

/* ── Mock fallback ──────────────────────────────────────────────── */
function buildMock(payload: AgentPayload): HermesResult {
  const { counts, project } = payload
  const summary_text = payload.tickets.length === 0
    ? `ไม่มีบั๊กค้าง (open / in-progress) สำหรับ ${project.name} (${project.code}) — ระบบปกติดี`
    : `มีบั๊กค้าง ${counts.total} รายการสำหรับ ${project.name} — ` +
      `critical ${counts.critical}, high ${counts.high}, medium ${counts.medium}, low ${counts.low}`
  const action_items: HermesResult['action_items'] = []
  if (counts.critical > 0) action_items.push({
    problem: `มีบั๊ก critical ${counts.critical} รายการที่ต้องจัดการด่วน`,
    solution: 'ทบทวน จัดลำดับความสำคัญ และมอบหมายให้ทีม dev วันนี้',
    owner: 'Dev Team', priority: 'critical', done: false,
  })
  if (counts.high > 0) action_items.push({
    problem: `มีบั๊ก high ${counts.high} รายการเสี่ยงหลุด sprint`,
    solution: 'จัดเข้า sprint planning รอบถัดไป',
    owner: 'Tech Lead', priority: 'high', done: false,
  })
  return { summary_text, top_risks: [], action_items }
}

/* ── Main ───────────────────────────────────────────────────────── */
export async function callHermesAgent(
  tickets: TicketWithProject[],
  project: Project,
  options: { profile?: string; scope?: string; soul?: string } = {}
): Promise<HermesResult> {
  const scope   = options.scope ?? 'Outstanding tickets (open + in progress)'
  const profile = options.profile ?? 'default'

  const payload = buildPayload(tickets, project, scope)
  const prompt  = buildPromptFromPayload(payload, options.soul)

  // Check env OR config file (config file takes precedence)
  const { readConfig } = await import('../config/config.service')
  const agentEnabled = (readConfig() as any).enabled ?? env.HERMES_AGENT_ENABLED
  if (!agentEnabled) return buildMock(payload)

  try {
    console.log(`[Hermes] profile:${profile} tickets:${tickets.length} scope:${scope}`)
    const raw    = await runHermesCLI(prompt, profile)
    const parsed = extractJson(raw)
    if (parsed?.summary_text) return parsed
    return { summary_text: raw.slice(0, 1000), action_items: [] }
  } catch (err) {
    console.warn('[Hermes] CLI failed, mock:', (err as Error).message)
    return buildMock(payload)
  }
}
