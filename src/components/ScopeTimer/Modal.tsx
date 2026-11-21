import { useEffect, useRef } from 'react'
import type { PropsWithChildren } from 'react'
import type { Theme } from './themes'

type Props = PropsWithChildren<{
  isOpen: boolean
  title: string
  onClose: () => void
  theme: Theme
}>

export function Modal({ isOpen, title, onClose, theme, children }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // 開いたらダイアログへフォーカスを移す。Esc や Tab の操作がモーダル内から始まるように
  useEffect(() => {
    if (isOpen) dialogRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKey)

    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(40rem, 100%)',
          maxHeight: '100%',
          overflowY: 'auto',
          padding: '1rem',
          backgroundColor: theme.BG_COLOR,
          color: theme.TEXT_COLOR,
          border: `2px solid ${theme.TEXT_COLOR}`,
          borderRadius: '8px',
          fontFamily: 'monospace',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            style={{
              background: 'transparent',
              color: theme.TEXT_COLOR,
              border: `2px solid ${theme.TEXT_COLOR}`,
              borderRadius: '4px',
              padding: '0.2rem 0.6rem',
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
