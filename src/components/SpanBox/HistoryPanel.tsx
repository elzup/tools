import { FaRegStar, FaRegTrashAlt, FaStar, FaUndoAlt } from 'react-icons/fa'
import styled from 'styled-components'
import type { HistoryEntry } from '../../lib/history'

type Block = { id: string }

type Props = {
  entries: HistoryEntry<Block[]>[]
  /** 表示の基準時刻 (ms)。相対表記に使う。 */
  now: number
  /** 現在ライブ状態に対応するエントリ id (restore で過去に駐機中)。 */
  activeId?: string | null
  onRestore: (id: string) => void
  onToggleBookmark: (id: string) => void
  onRemove: (id: string) => void
  onClear: () => void
}

/** 経過時間を「たった今 / N分前 / N時間前 / N日前」で表す。 */
const formatAgo = (timestamp: number, now: number): string => {
  const sec = Math.max(0, Math.floor((now - timestamp) / 1000))

  if (sec < 10) return 'たった今'
  if (sec < 60) return `${sec}秒前`
  const min = Math.floor(sec / 60)

  if (min < 60) return `${min}分前`
  const hour = Math.floor(min / 60)

  if (hour < 24) return `${hour}時間前`

  return `${Math.floor(hour / 24)}日前`
}

/**
 * SpanBox の作業内容スナップショット履歴。新しい順に並び、復元・ブックマーク・
 * 削除ができる。ブックマークしたものは上限超過でも破棄されない。
 */
export const HistoryPanel = ({
  entries,
  now,
  activeId,
  onRestore,
  onToggleBookmark,
  onRemove,
  onClear,
}: Props) => {
  if (entries.length === 0) {
    return <Empty>履歴なし — 編集すると自動で記録されます</Empty>
  }

  // 駐機中なら、現在位置より新しい (先=redo 相当) エントリをグレーアウトする
  const activeTs =
    activeId != null
      ? entries.find((e) => e.id === activeId)?.timestamp
      : undefined

  return (
    <>
      <ClearRow>
        <ClearButton type="button" onClick={onClear}>
          履歴を全消去 (ブックマーク含む)
        </ClearButton>
      </ClearRow>
      <List>
        {entries.map((entry) => (
          <Row
            key={entry.id}
            $bookmarked={!!entry.bookmarked}
            $active={entry.id === activeId}
            $future={activeTs !== undefined && entry.timestamp > activeTs}
          >
            <StarButton
              type="button"
              onClick={() => onToggleBookmark(entry.id)}
              title={entry.bookmarked ? 'ブックマーク解除' : 'ブックマーク'}
              $active={!!entry.bookmarked}
            >
              {entry.bookmarked ? <FaStar /> : <FaRegStar />}
            </StarButton>
            <Meta onClick={() => onRestore(entry.id)} title="この状態を復元">
              <span className="label">{entry.label ?? 'snapshot'}</span>
              <span className="time">{formatAgo(entry.timestamp, now)}</span>
            </Meta>
            <IconButton
              type="button"
              onClick={() => onRestore(entry.id)}
              title="復元"
            >
              <FaUndoAlt />
            </IconButton>
            <IconButton
              type="button"
              onClick={() => onRemove(entry.id)}
              title="削除"
            >
              <FaRegTrashAlt />
            </IconButton>
          </Row>
        ))}
      </List>
    </>
  )
}

const Empty = styled.p`
  margin: 0;
  color: #9aa3b2;
  font-size: 0.78rem;
`

const ClearRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 4px;
`

const ClearButton = styled.button`
  padding: 0;
  border: 0;
  background: none;
  color: #9aa3b2;
  font-size: 0.7rem;
  cursor: pointer;

  &:hover {
    color: #e11d48;
    text-decoration: underline;
  }
`

const List = styled.div`
  display: grid;
  align-content: start;
  gap: 4px;
  flex: 1;
  min-height: 0;
  max-height: 420px;
  overflow: auto;
`

const Row = styled.div<{
  $bookmarked: boolean
  $active: boolean
  $future: boolean
}>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border: 1px solid
    ${({ $active, $bookmarked }) =>
      $active ? '#256ee8' : $bookmarked ? '#f5b301' : '#e2e7f0'};
  border-radius: 6px;
  background: ${({ $active, $bookmarked }) =>
    $active ? '#eef2fb' : $bookmarked ? '#fff8e6' : '#ffffff'};
  /* 現在位置より先 (redo 相当) は薄く表示 */
  opacity: ${({ $future }) => ($future ? 0.45 : 1)};
`

const Meta = styled.button`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 0;
  border: 0;
  background: none;
  text-align: left;
  cursor: pointer;

  .label {
    overflow: hidden;
    color: #202631;
    font-size: 0.8rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .time {
    color: #9aa3b2;
    font-size: 0.66rem;
  }
`

const IconButton = styled.button`
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border: 1px solid #c7d0dd;
  border-radius: 5px;
  background: #ffffff;
  color: #202631;
  cursor: pointer;

  &:hover {
    background: #f0f4fa;
  }
`

const StarButton = styled(IconButton)<{ $active: boolean }>`
  border-color: ${({ $active }) => ($active ? '#f5b301' : '#c7d0dd')};
  color: ${({ $active }) => ($active ? '#f5b301' : '#b6bece')};

  &:hover {
    color: #f5b301;
  }
`
