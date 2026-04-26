export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
}

type Listener = (toasts: Toast[]) => void

let toasts: Toast[] = []
const listeners: Set<Listener> = new Set()

function notify() {
  listeners.forEach((fn) => fn([...toasts]))
}

function push(message: string, type: ToastType) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  toasts = [...toasts, { id, message, type }]
  notify()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    notify()
  }, 4000)
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  fn([...toasts])
  return () => listeners.delete(fn)
}

export const toast = {
  success: (message: string) => push(message, 'success'),
  error: (message: string) => push(message, 'error'),
  info: (message: string) => push(message, 'info'),
}
