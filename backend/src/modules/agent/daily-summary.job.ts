import cron, { ScheduledTask } from 'node-cron'
import { Prisma } from '@prisma/client'
import prisma from '../../lib/prisma'
import { callHermesAgent, sendNotification } from './hermes.service'
// re-export for controller
export { sendNotification }
import { readConfig } from '../config/config.service'
import { Ticket, Project } from '@prisma/client'

interface TicketWithProject extends Ticket { project: Project }

const DEFAULT_CRON = '0 8 * * *'
const DEFAULT_TZ   = 'Asia/Bangkok'

/* ── Run summary for one project ─────────────────────────────────── */
export async function runProjectSummary(project: Project): Promise<string | null> {
  const config   = readConfig() as any
  const schedule = config.schedule ?? {}
  const profile  = (project as any).hermes_profile ?? schedule.profile ?? 'default'

  const SCOPE = 'Outstanding tickets (open + in progress)'

  // All unresolved tickets, regardless of when they were created
  const tickets = await prisma.ticket.findMany({
    where: { project_id: project.id, status: { in: ['open', 'in_progress'] } },
    include: { project: true },
    orderBy: { created_at: 'desc' },
  }) as TicketWithProject[]

  const summaryDate = new Date()
  summaryDate.setHours(0, 0, 0, 0)

  console.log(`[Cron:${project.code}] ${tickets.length} outstanding tickets → profile:${profile}`)

  try {
    const result = await callHermesAgent(tickets, project, { profile, scope: SCOPE })

    await prisma.dailyBugSummary.create({
      data: {
        summary_date:      summaryDate,
        project_id:        project.id,
        total_tickets:     tickets.length,
        critical_count:    tickets.filter(t => t.severity === 'critical').length,
        high_count:        tickets.filter(t => t.severity === 'high').length,
        medium_count:      tickets.filter(t => t.severity === 'medium').length,
        low_count:         tickets.filter(t => t.severity === 'low').length,
        summary_text:      result.summary_text,
        action_items_json: result.action_items as unknown as Prisma.InputJsonValue,
      },
    })

    // Notify
    if (schedule.notify) {
      const date = summaryDate.toLocaleDateString('th-TH', {
        day: 'numeric', month: 'long', year: 'numeric',
        timeZone: schedule.timezone ?? DEFAULT_TZ,
      })
      // Attach counts so Discord embed can show severity breakdown
      const enrichedResult = {
        ...result,
        counts: {
          total:    tickets.length,
          critical: tickets.filter(t => t.severity === 'critical').length,
          high:     tickets.filter(t => t.severity === 'high').length,
          medium:   tickets.filter(t => t.severity === 'medium').length,
          low:      tickets.filter(t => t.severity === 'low').length,
        },
        scope: SCOPE,
      }
      // Project-level webhook overrides global config
      const webhookUrl = (project as any).discord_webhook_url || schedule.discordWebhookUrl
      await sendNotification(enrichedResult, {
        notifyTarget:      schedule.notifyTarget,
        discordWebhookUrl: webhookUrl,
        telegramTarget:    schedule.telegramTarget,
      }, project.code, project.name, date).catch(e => console.warn('[Notify]', (e as Error).message))
    }

    console.log(`[Cron:${project.code}] Summary saved`)
    return result.summary_text
  } catch (err) {
    console.error(`[Cron:${project.code}] Failed:`, (err as Error).message)
    return null
  }
}

/* ── Manual "Run Now" — all enabled projects ─────────────────────── */
export async function runDailyBugSummary(): Promise<{ saved: number; notified: boolean }> {
  const projects = await prisma.project.findMany({
    where: { status: 'Active', cron_enabled: true },
  })

  console.log(`[DailySummaryJob] Running ${projects.length} enabled project(s)`)

  let saved = 0
  for (const project of projects) {
    const result = await runProjectSummary(project)
    if (result) saved++
  }

  return { saved, notified: saved > 0 }
}

/* ── Per-project scheduled tasks registry ────────────────────────── */
interface TaskEntry {
  task: ScheduledTask
  code: string
  name: string
  expr: string
  tz: string
  profile: string
  discordConfigured: boolean
}
const tasks = new Map<string, TaskEntry>()

function stopTask(projectId: string) {
  const entry = tasks.get(projectId)
  if (entry) { entry.task.stop(); tasks.delete(projectId) }
}

export function scheduleProject(project: Project): void {
  stopTask(project.id)

  if (!(project as any).cron_enabled) return

  const expr = (project as any).cron_expr || DEFAULT_CRON
  const tz   = (readConfig() as any).schedule?.timezone ?? DEFAULT_TZ

  if (!cron.validate(expr)) {
    console.warn(`[Cron:${project.code}] Invalid expression: "${expr}", skipping`)
    return
  }

  const task = cron.schedule(expr, async () => {
    await runProjectSummary(project)
  }, { timezone: tz })

  tasks.set(project.id, {
    task, code: project.code, name: project.name, expr, tz,
    profile: (project as any).hermes_profile ?? ((readConfig() as any).schedule?.profile ?? 'default'),
    discordConfigured: !!(project as any).discord_webhook_url,
  })
  console.log(`[Cron:${project.code}] Scheduled "${expr}" (${tz})`)
}

/* ── Next-run times for all scheduled projects ──────────────────── */
export interface NextRun {
  projectId: string
  code: string
  name: string
  cronExpr: string
  timezone: string
  nextRun: string | null   // ISO timestamp
  profile: string
  discordConfigured: boolean
}

export function getNextRuns(): NextRun[] {
  const runs: NextRun[] = []
  for (const [projectId, entry] of tasks.entries()) {
    let nextRun: string | null = null
    try { nextRun = entry.task.getNextRun()?.toISOString() ?? null } catch {}
    runs.push({
      projectId,
      code: entry.code,
      name: entry.name,
      cronExpr: entry.expr,
      timezone: entry.tz,
      nextRun,
      profile: entry.profile,
      discordConfigured: entry.discordConfigured,
    })
  }
  // soonest first
  return runs.sort((a, b) => {
    if (!a.nextRun) return 1
    if (!b.nextRun) return -1
    return a.nextRun.localeCompare(b.nextRun)
  })
}

/* ── Boot: schedule all currently-enabled projects ──────────────── */
export async function startDailySummaryJob(): Promise<void> {
  const projects = await prisma.project.findMany({ where: { status: 'Active' } })

  for (const p of projects) {
    scheduleProject(p)
  }

  const enabled = projects.filter(p => (p as any).cron_enabled).length
  console.log(`[DailySummaryJob] Boot: ${enabled}/${projects.length} projects scheduled`)
}
