import { api } from './api'
import type { Project } from '@/types'

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#14b8a6','#0ea5e9','#22c55e','#f59e0b','#06b6d4']

function colorFromCode(code: string): string {
  let h = 0
  for (const c of code) h = ((h << 5) - h + c.charCodeAt(0)) | 0
  return COLORS[Math.abs(h) % COLORS.length]
}

function withColor(p: unknown): Project {
  const proj = p as Project
  return { ...proj, color: proj.color || colorFromCode(proj.code) }
}

export const projectApi = {
  list: () =>
    api.get('/projects').then(r => (r.data as unknown[]).map(withColor)),
  get: (id: string) =>
    api.get('/projects/' + id).then(r => withColor(r.data)),
  create: (payload: Omit<Project, 'id' | 'color'>) =>
    api.post('/projects', payload).then(r => withColor(r.data)),
  update: (id: string, payload: Partial<Project>) =>
    api.put('/projects/' + id, payload).then(r => withColor(r.data)),
  remove: (id: string) =>
    api.delete('/projects/' + id),
}
