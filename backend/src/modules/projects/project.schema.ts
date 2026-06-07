import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required').toUpperCase(),
  description: z.string().optional(),
  design_context_path: z.string().optional(),
  hermes_profile: z.string().optional().nullable(),
  cron_enabled:          z.boolean().optional(),
  cron_expr:             z.string().optional().nullable(),
  cron_window_hours:     z.number().int().min(1).max(168).optional(),
  discord_webhook_url:   z.string().optional().nullable(),
  status: z.enum(['Active', 'Archived']).default('Active'),
})

export const updateProjectSchema = createProjectSchema.partial()

export type CreateProjectDto = z.infer<typeof createProjectSchema>
export type UpdateProjectDto = z.infer<typeof updateProjectSchema>
