import { Request, Response, NextFunction } from 'express'
import * as service from './ticket.service'
import {
  createTicketSchema,
  updateTicketSchema,
  updateStatusSchema,
  ticketFiltersSchema,
} from './ticket.schema'

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = ticketFiltersSchema.parse(req.query)
    const data = await service.getTickets(filters)
    res.json({ success: true, message: 'Success', data })
  } catch (e) { next(e) }
}

export async function show(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getTicketById(req.params['id'] as string)
    res.json({ success: true, message: 'Success', data })
  } catch (e) { next(e) }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = createTicketSchema.parse(req.body)
    const files = (req.files as Express.Multer.File[]) || []
    const data = await service.createTicket(dto, files)
    res.status(201).json({ success: true, message: 'Ticket created', data })
  } catch (e) { next(e) }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = updateTicketSchema.parse(req.body)
    const data = await service.updateTicket(req.params['id'] as string, dto)
    res.json({ success: true, message: 'Ticket updated', data })
  } catch (e) { next(e) }
}

export async function patchStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = updateStatusSchema.parse(req.body)
    const data = await service.updateTicketStatus(req.params['id'] as string, dto)
    res.json({ success: true, message: 'Status updated', data })
  } catch (e) { next(e) }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteTicket(req.params['id'] as string)
    res.json({ success: true, message: 'Ticket deleted', data: null })
  } catch (e) { next(e) }
}
