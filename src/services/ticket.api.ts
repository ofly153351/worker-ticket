import { api } from './api'
import type { Ticket, TicketFilters, TicketStatus, TimelineEntry, TicketImage } from '@/types'

// Backend images: { id, fileUrl, fileName, ... } → frontend: { id, url, filename }
function normalizeImage(img: Record<string, unknown>): TicketImage {
  return { id: img['id'] as string, url: img['fileUrl'] as string, filename: img['fileName'] as string }
}

function normalizeTicket(t: Record<string, unknown>): Ticket {
  return { ...(t as unknown as Ticket), images: ((t['images'] as Record<string, unknown>[]) || []).map(normalizeImage) }
}

export const ticketApi = {
  list: (filters?: TicketFilters) =>
    api.get('/tickets', { params: filters }).then(r => {
      const data = r.data as { items?: unknown[] } | unknown[]
      const items = Array.isArray(data) ? data : (data as { items?: unknown[] }).items ?? []
      return items.map(t => normalizeTicket(t as Record<string, unknown>))
    }),

  get: (id: string) =>
    api.get('/tickets/' + id).then(r => normalizeTicket(r.data as Record<string, unknown>)),

  create: (formData: FormData) =>
    api.post('/tickets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => normalizeTicket(r.data as Record<string, unknown>)),

  updateStatus: (id: string, status: TicketStatus) =>
    api.patch('/tickets/' + id + '/status', { status }).then(r => normalizeTicket(r.data as Record<string, unknown>)),

  addComment: (id: string, text: string) =>
    api.post<TimelineEntry>('/tickets/' + id + '/comments', { text }).then(r => r.data as unknown as TimelineEntry),

  delete: (id: string) => api.delete('/tickets/' + id),
}
