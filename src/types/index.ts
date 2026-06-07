// Core domain types for Hermes Bug Tracker

export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'rejected'

export interface Project {
  id: string
  name: string
  code: string
  description: string
  status: 'Active' | 'Archived'
  color: string
  design_context_path?: string | null
  designContextPath?: string | null
  hermesProfile?: string | null
  cronEnabled?: boolean
  cronExpr?: string | null
  cronWindowHours?: number
  discordWebhookUrl?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface TicketImage {
  id: string
  url: string
  filename: string
}

export interface TimelineEntry {
  id: string
  type: 'created' | 'status' | 'comment'
  actor: string
  text: string
  createdAt: string
  to?: TicketStatus
}

export interface Ticket {
  id: string
  projectId: string
  title: string
  description: string
  severity: Severity
  status: TicketStatus
  reporterName: string
  pageUrl: string
  browserInfo: string
  createdAt: string
  images: TicketImage[]
  timeline?: TimelineEntry[]
}

export interface TicketFilters {
  q?: string
  projectId?: string
  severity?: Severity | ''
  status?: TicketStatus | ''
}

export interface SummaryActionItem {
  text: string
  owner: string
  done: boolean
}

export interface DailySummary {
  id: string
  date: string
  projectId: string
  total: number
  counts: Record<Severity, number>
  executive: string
  repeated: string[]
  fixOrder: string[]
  actions: SummaryActionItem[]
}
