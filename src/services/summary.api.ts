import { api } from './api'
import type { DailySummary, SummaryActionItem } from '@/types'

function normalizeSummary(s: Record<string, unknown>): DailySummary {
  const actions = (s['actionItemsJson'] as SummaryActionItem[] | null) ?? []
  return {
    id: s['id'] as string,
    date: s['summaryDate'] as string,
    projectId: (s['projectId'] as string) ?? '',
    total: (s['totalTickets'] as number) ?? 0,
    counts: {
      critical: (s['criticalCount'] as number) ?? 0,
      high: (s['highCount'] as number) ?? 0,
      medium: (s['mediumCount'] as number) ?? 0,
      low: (s['lowCount'] as number) ?? 0,
    },
    executive: (s['summaryText'] as string) ?? '',
    repeated: [],
    fixOrder: [],
    actions: Array.isArray(actions) ? actions : [],
  }
}

export const summaryApi = {
  list: (params?: { projectId?: string; date?: string }) =>
    api.get('/summaries', { params }).then(r => (r.data as unknown[]).map(s => normalizeSummary(s as Record<string, unknown>))),

  get: (id: string) =>
    api.get('/summaries/' + id).then(r => normalizeSummary(r.data as Record<string, unknown>)),

  generate: (projectId?: string) =>
    api.post('/summaries/generate', { projectId }).then(r => r.data),
}
