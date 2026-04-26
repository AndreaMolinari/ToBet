import { useEffect, useState } from 'react'
import { subscribe, type Toast } from '../lib/toast'

const icons: Record<Toast['type'], string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
}

const colors: Record<Toast['type'], string> = {
  success: 'var(--color-success)',
  error: 'var(--color-danger)',
  info: 'var(--color-accent)',
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => subscribe(setToasts), [])

  if (toasts.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 18px',
              borderRadius: 'var(--border-radius-md)',
              background: 'var(--color-background-secondary)',
              border: '1px solid var(--color-border-tertiary)',
              color: 'var(--color-text-primary)',
              fontSize: 14,
              whiteSpace: 'nowrap',
              animation: 'toast-in 0.2s ease',
            }}
          >
            <span style={{ color: colors[t.type], fontWeight: 700, fontSize: 15 }}>
              {icons[t.type]}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </>
  )
}
