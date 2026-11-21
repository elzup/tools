import { Modal } from './Modal'
import type { Theme } from './themes'
import { REFRESH_TOLERANCE } from './useDisplayRefreshRate'

export const FPS_OPTIONS = [15, 24, 30, 60] as const

type Props = {
  isOpen: boolean
  value: number
  onSelect: (fps: number) => void
  onClose: () => void
  theme: Theme
  refreshHz: number | null
}

export function FpsModal({
  isOpen,
  value,
  onSelect,
  onClose,
  theme,
  refreshHz,
}: Props) {
  return (
    <Modal isOpen={isOpen} title="FPS" onClose={onClose} theme={theme}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
          数字の更新頻度。ブロック列とバーは常に毎フレーム更新。
          {refreshHz === null
            ? ' 画面のリフレッシュレートを計測中'
            : ` この画面は約 ${refreshHz.toFixed(1)}Hz`}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(6rem, 1fr))',
            gap: '0.5rem',
          }}
        >
          {FPS_OPTIONS.map((option) => {
            const isSelected = option === value
            const isDisabled =
              refreshHz !== null && option > refreshHz * REFRESH_TOLERANCE

            return (
              <button
                key={option}
                type="button"
                aria-pressed={isSelected}
                disabled={isDisabled}
                title={
                  isDisabled
                    ? 'この画面のリフレッシュレートを超える'
                    : undefined
                }
                onClick={() => onSelect(option)}
                style={{
                  padding: '0.75rem',
                  // 選択中は文字色と背景色を入れ替える。どのテーマでも TEXT/BG の組なので読める
                  backgroundColor: isSelected
                    ? theme.TEXT_COLOR
                    : 'transparent',
                  color: isSelected ? theme.BG_COLOR : theme.TEXT_COLOR,
                  border: `2px solid ${theme.TEXT_COLOR}`,
                  borderRadius: '6px',
                  opacity: isDisabled ? 0.35 : 1,
                  textDecoration: isDisabled ? 'line-through' : 'none',
                  fontFamily: 'inherit',
                  fontSize: '1.2rem',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                }}
              >
                {option}fps
              </button>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
