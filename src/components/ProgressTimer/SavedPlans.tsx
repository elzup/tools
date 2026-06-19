import { Button, Chip } from '@mui/material'
import styled from 'styled-components'
import type { ProgressTimerApi } from './useProgressTimer'

/**
 * 保存スロット一覧。テキストの `@9:00 projA_001` の id をキーに
 * 予定を複数保持し、チップのクリックで切り替える。
 */
export const SavedPlans = ({ t }: { t: ProgressTimerApi }) => {
  const currentId = t.plan.id

  return (
    <Wrap>
      <span className="label">保存スロット</span>
      {t.library.length === 0 && (
        <span className="empty">なし — @行に id を付けて保存</span>
      )}
      {t.library.map((slot) => (
        <Chip
          key={slot.id}
          label={slot.id}
          size="small"
          color={slot.id === currentId ? 'primary' : 'default'}
          variant={slot.id === currentId ? 'filled' : 'outlined'}
          onClick={() => t.loadSlot(slot.id)}
          onDelete={() => t.removeSlot(slot.id)}
        />
      ))}
      <Button
        variant="outlined"
        size="small"
        onClick={t.saveSlot}
        disabled={!currentId}
        title={
          currentId ? `${currentId} に保存` : '@行に id を付けると保存できます'
        }
      >
        {currentId ? `保存 (${currentId})` : '保存'}
      </Button>
    </Wrap>
  )
}

const Wrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 8px 10px;
  border: 1px solid #eee;
  border-radius: 8px;

  .label {
    font-size: 0.8rem;
    color: #888;
    font-weight: 600;
  }
  .empty {
    font-size: 0.8rem;
    color: #bbb;
  }
`
