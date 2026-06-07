import { Request, Response, NextFunction } from 'express'
import * as service from './project.service'
import { createProjectSchema, updateProjectSchema } from './project.schema'
import { scheduleProject, runProjectSummary } from '../agent/daily-summary.job'
import { previewPayload } from '../agent/hermes.service'
import { Project } from '@prisma/client'

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getAllProjects()
    res.json({ success: true, message: 'Success', data })
  } catch (e) { next(e) }
}

export async function show(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getProjectById(req.params['id'] as string)
    res.json({ success: true, message: 'Success', data })
  } catch (e) { next(e) }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = createProjectSchema.parse(req.body)
    const data = await service.createProject(dto)
    // Schedule cron if enabled at creation
    scheduleProject(data as unknown as Project)
    res.status(201).json({ success: true, message: 'Project created', data })
  } catch (e) { next(e) }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = updateProjectSchema.parse(req.body)
    const data = await service.updateProject(req.params['id'] as string, dto)
    // Re-schedule after any update (cron_enabled/cron_expr may have changed)
    scheduleProject(data as unknown as Project)
    res.json({ success: true, message: 'Project updated', data })
  } catch (e) { next(e) }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteProject(req.params['id'] as string)
    res.json({ success: true, message: 'Project deleted', data: null })
  } catch (e) { next(e) }
}

export async function previewSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await service.getProjectById(req.params['id'] as string)
    const SCOPE = 'Outstanding tickets (open + in progress)'

    const tickets = await (await import('../../lib/prisma')).default.ticket.findMany({
      where: { project_id: project.id, status: { in: ['open', 'in_progress'] } },
      include: { project: true },
      orderBy: { created_at: 'desc' },
    })

    const result = previewPayload(tickets as any, project as any, SCOPE)
    res.json({ success: true, message: 'Preview generated', data: result })
  } catch (e) { next(e) }
}

export async function runSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await service.getProjectById(req.params['id'] as string)
    // Fire-and-forget
    runProjectSummary(project as unknown as Project)
      .catch(e => console.error('[runSummary]', e))
    res.json({ success: true, message: 'Summary job started', data: null })
  } catch (e) { next(e) }
}
