import { Request, Response, NextFunction } from 'express'
import * as service from './summary.service'
import { runDailyBugSummary } from '../agent/daily-summary.job'

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getAllSummaries()
    res.json({ success: true, message: 'Success', data })
  } catch (e) { next(e) }
}

export async function show(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getSummaryById(req.params['id'] as string)
    res.json({ success: true, message: 'Success', data })
  } catch (e) { next(e) }
}

export async function generate(_req: Request, res: Response, next: NextFunction) {
  try {
    await runDailyBugSummary()
    const data = await service.getAllSummaries()
    res.json({ success: true, message: 'Summary generated', data })
  } catch (e) { next(e) }
}
