import { reactive } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  body?: string
  duration?: number
}

// Module-level singleton — importable from any component without provide/inject.
export const toasts = reactive<Toast[]>([])

export function useToast() {
  function push(t: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).slice(2)
    toasts.push({ id, ...t })
    setTimeout(() => {
      const i = toasts.findIndex(x => x.id === id)
      if (i >= 0) toasts.splice(i, 1)
    }, t.duration ?? 3800)
  }
  function success(title: string, body?: string) { push({ type: 'success', title, body }) }
  function error(title: string, body?: string)   { push({ type: 'error',   title, body }) }
  return { toasts, push, success, error }
}
