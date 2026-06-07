import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ticketApi } from '@/services/ticket.api'
import type { Ticket, TicketFilters, TicketStatus } from '@/types'

export const useTicketStore = defineStore('tickets', () => {
  const tickets       = ref<Ticket[]>([])
  const currentTicket = ref<Ticket | null>(null)
  const loading       = ref(false)
  const detailLoading = ref(false)
  const error         = ref<string | null>(null)
  const filters       = ref<TicketFilters>({})

  const filteredTickets = computed(() => {
    const f   = filters.value
    let list  = [...tickets.value]
    if (f.projectId) list = list.filter(t => t.projectId === f.projectId)
    if (f.severity)  list = list.filter(t => t.severity  === f.severity)
    if (f.status)    list = list.filter(t => t.status    === f.status)
    if (f.q) {
      const q = f.q.toLowerCase()
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  })

  const stats = computed(() => {
    const today = new Date().toDateString()
    return {
      total:    tickets.value.length,
      open:     tickets.value.filter(t => t.status   === 'open').length,
      critical: tickets.value.filter(t => t.severity === 'critical').length,
      today:    tickets.value.filter(t => new Date(t.createdAt).toDateString() === today).length,
    }
  })

  async function fetchAll(f?: TicketFilters) {
    loading.value = true
    error.value   = null
    try {
      tickets.value = await ticketApi.list(f)
    } catch {
      error.value = 'Could not load tickets.'
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: string) {
    detailLoading.value = true
    error.value         = null
    try {
      currentTicket.value = await ticketApi.get(id)
    } catch {
      error.value         = 'Could not load ticket.'
      currentTicket.value = null
    } finally {
      detailLoading.value = false
    }
  }

  async function create(formData: FormData): Promise<Ticket> {
    const ticket = await ticketApi.create(formData)
    tickets.value.unshift(ticket)
    return ticket
  }

  async function updateStatus(id: string, status: TicketStatus): Promise<Ticket> {
    const updated = await ticketApi.updateStatus(id, status)
    const idx = tickets.value.findIndex(t => t.id === id)
    if (idx >= 0) tickets.value[idx] = updated
    if (currentTicket.value?.id === id) currentTicket.value = updated
    return updated
  }

  return {
    tickets, currentTicket, loading, detailLoading, error, filters,
    filteredTickets, stats,
    fetchAll, fetchOne, create, updateStatus,
  }
})
