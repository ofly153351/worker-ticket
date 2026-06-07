import type { Severity, TicketStatus } from '@/types'

export const SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical']
export const TICKET_STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'rejected']

export const SEVERITY_META: Record<Severity, {
  label: string; dot: string; text: string; bg: string; bgDark: string; textDark: string
}> = {
  low:      { label: 'Low',      dot: '#94a3b8', text: '#475569', bg: '#f1f5f9', bgDark: '#1e293b', textDark: '#cbd5e1' },
  medium:   { label: 'Medium',   dot: '#3b82f6', text: '#1d4ed8', bg: '#eff6ff', bgDark: '#172554', textDark: '#93c5fd' },
  high:     { label: 'High',     dot: '#f97316', text: '#c2410c', bg: '#fff7ed', bgDark: '#431407', textDark: '#fdba74' },
  critical: { label: 'Critical', dot: '#ef4444', text: '#b91c1c', bg: '#fef2f2', bgDark: '#450a0a', textDark: '#fca5a5' },
}

export const STATUS_META: Record<TicketStatus, {
  label: string; dot: string; text: string; bg: string; bgDark: string; textDark: string
}> = {
  open:        { label: 'Open',        dot: '#3b82f6', text: '#1d4ed8', bg: '#eff6ff', bgDark: '#172554', textDark: '#93c5fd' },
  in_progress: { label: 'In Progress', dot: '#a855f7', text: '#7e22ce', bg: '#faf5ff', bgDark: '#3b0764', textDark: '#d8b4fe' },
  resolved:    { label: 'Resolved',    dot: '#22c55e', text: '#15803d', bg: '#f0fdf4', bgDark: '#052e16', textDark: '#86efac' },
  rejected:    { label: 'Rejected',    dot: '#94a3b8', text: '#475569', bg: '#f8fafc', bgDark: '#1e293b', textDark: '#94a3b8' },
}
