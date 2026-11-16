import { createContext, useContext, useLayoutEffect } from 'react'

// 計測値を React の state に入れると「表示のための再レンダー」が起きて計測対象を汚すので、
// 回数は React 外のミュータブルな板に貯め、DOM へ直接書く
export type ProbeEntry = {
  count: number
  lastSeq: number
  countEl: HTMLElement | null
  statusEl: HTMLElement | null
}

export type ProbeBoard = {
  seq: number
  entries: Map<string, ProbeEntry>
}

export type ProbeStatus = 'initial' | 'ran' | 'skipped'

// 色の点滅が終わる前に次の操作をしても判別できる長さ
const FLASH_MS = 700
const FLASH_KEYFRAMES: Keyframe[] = [
  { backgroundColor: 'rgba(255, 193, 7, 0.55)' },
  { backgroundColor: 'rgba(255, 193, 7, 0)' },
]

export const createBoard = (): ProbeBoard => ({ seq: 0, entries: new Map() })

export const ProbeBoardContext = createContext<ProbeBoard>(createBoard())

export const useProbeBoard = () => useContext(ProbeBoardContext)

export const entryOf = (board: ProbeBoard, key: string): ProbeEntry => {
  const existing = board.entries.get(key)
  if (existing) return existing
  const created: ProbeEntry = {
    count: 0,
    lastSeq: -1,
    countEl: null,
    statusEl: null,
  }
  board.entries.set(key, created)
  return created
}

const flash = (el: HTMLElement) => {
  const target = el.closest<HTMLElement>('[data-flash]') ?? el
  // happy-dom など Web Animations 未実装の環境では点滅だけ諦める (回数表示は正しい)
  if (typeof target.animate !== 'function') return
  target.animate(FLASH_KEYFRAMES, { duration: FLASH_MS, easing: 'ease-out' })
}

export const paintCount = (entry: ProbeEntry) => {
  if (entry.countEl) entry.countEl.textContent = `${entry.count} 回`
}

/** 実行 1 回を記録する。描画・useMemo の計算・useEffect の実行から呼ぶ */
export const bump = (board: ProbeBoard, key: string) => {
  const entry = entryOf(board, key)
  entry.count += 1
  entry.lastSeq = board.seq
  paintCount(entry)
  if (board.seq > 0 && entry.countEl) flash(entry.countEl)
}

export const statusOf = (board: ProbeBoard, entry: ProbeEntry): ProbeStatus => {
  if (board.seq === 0) return 'initial'
  return entry.lastSeq === board.seq ? 'ran' : 'skipped'
}

const STATUS_LABEL: Record<ProbeStatus, string> = {
  initial: '初回',
  ran: '実行',
  skipped: 'スキップ',
}

export const paintStatus = (board: ProbeBoard, entry: ProbeEntry) => {
  if (!entry.statusEl) return
  const status = statusOf(board, entry)
  entry.statusEl.textContent = STATUS_LABEL[status]
  entry.statusEl.dataset.state = status
}

/** 直前の操作で各計測点が動いたかを表示する。全 effect の後に呼ぶ */
export const paintAllStatus = (board: ProbeBoard) => {
  board.entries.forEach((entry) => paintStatus(board, entry))
}

/**
 * コンポーネントが実際にコミットされた回数を数える。
 * render 本体ではなく layout effect で数えるのは、React.memo でスキップされたときに
 * 確実に増えないことと、捨てられた render を数えないため
 */
export const useRenderProbe = (key: string) => {
  const board = useProbeBoard()
  useLayoutEffect(() => {
    bump(board, key)
  })
}
