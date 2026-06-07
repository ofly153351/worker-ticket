import { z } from 'zod'

export const createTicketSchema = z.object({
  project_id: z.string().min(1, 'project_id is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  reporter_name: z.string().min(1, 'Reporter name is required'),
  page_url: z.string().optional(),
  browser_info: z.string().optional(),
  device_info: z.string().optional(),
})

export const updateTicketSchema = createTicketSchema.partial()

export const updateStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'rejected']),
})

export const ticketFiltersSchema = z.object({
  project_id: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'rejected']).optional(),
  search: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateTicketDto = z.infer<typeof createTicketSchema>
export type UpdateTicketDto = z.infer<typeof updateTicketSchema>
export type UpdateStatusDto = z.infer<typeof updateStatusSchema>
export type TicketFilters = z.infer<typeof ticketFiltersSchema>
