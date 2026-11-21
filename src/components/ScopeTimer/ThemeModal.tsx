import { Modal } from './Modal'
import { THEMES, THEME_KEYS } from './themes'
import type { Theme, ThemeKey } from './themes'

type Props = {
  isOpen: boolean
  value: ThemeKey
  onSelect: (key: ThemeKey) => void
  onClose: () => void
  theme: Theme
}

// 各カードは自分のテーマ色で描く。カードの文字色/背景色はそのテーマの組なので hover しても読める
function ThemeCard({
  themeKey,
  isSelected,
  onSelect,
  ringColor,
}: {
  themeKey: ThemeKey
  isSelected: boolean
  onSelect: (key: ThemeKey) => void
  ringColor: string
}) {
  const card = THEMES[themeKey]

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onSelect(themeKey)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '0.75rem',
        backgroundColor: card.BG_COLOR,
        color: card.TEXT_COLOR,
        border: `2px solid ${card.TEXT_COLOR}`,
        borderRadius: '6px',
        // 選択中の印は box-shadow で付ける。outline はキーボードフォーカスの表示に残す
        boxShadow: isSelected ? `0 0 0 4px ${ringColor}` : 'none',
        fontFamily: 'monospace',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: '0.9rem' }}>{card.LABEL}</span>
      <span style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>12.345</span>
      <span
        style={{
          display: 'block',
          width: '70%',
          height: '6px',
          borderRadius: '3px',
          backgroundColor: card.BAR_COLOR,
        }}
      />
    </button>
  )
}

export function ThemeModal({ isOpen, value, onSelect, onClose, theme }: Props) {
  return (
    <Modal isOpen={isOpen} title="Theme" onClose={onClose} theme={theme}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))',
          gap: '0.75rem',
        }}
      >
        {THEME_KEYS.map((key) => (
          <ThemeCard
            key={key}
            themeKey={key}
            isSelected={key === value}
            onSelect={onSelect}
            ringColor={theme.TEXT_COLOR}
          />
        ))}
      </div>
    </Modal>
  )
}
