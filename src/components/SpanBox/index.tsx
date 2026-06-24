import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FaChevronDown,
  FaChevronUp,
  FaCopy,
  FaEllipsisV,
  FaEye,
  FaEyeSlash,
  FaFileAlt,
  FaFont,
  FaHistory,
  FaLayerGroup,
  FaLock,
  FaLockOpen,
  FaPalette,
  FaPlus,
  FaRedo,
  FaRetweet,
  FaTrash,
  FaUndo,
} from 'react-icons/fa'
import styled from 'styled-components'
import { combineAll, recordOnChange, recordOnInterval } from '../../lib/history'
import { useHistory } from '../../utils/useHistory'
import { useLocalStorage } from '../../utils/useLocalStorage'
import { HistoryPanel } from './HistoryPanel'

type SpanBoxBlock = {
  id: string
  x: number
  y: number
  width: number
  height: number
  color: string
  label: string
  /** ロック中は re-color の対象外 (色を保持する)。 */
  locked?: boolean
}

type DragAction =
  | { kind: 'move'; origin: GridPoint; snapshot: SpanBoxBlock[] }
  | {
      kind: 'resize'
      edge: ResizeEdge
      origin: GridPoint
      snapshot: SpanBoxBlock[]
    }

type GridPoint = {
  x: number
  y: number
}

type ResizeEdge =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

const minBlockSize = 1
const defaultColumns = 56
const defaultRows = 36
const minColumns = 8
const maxColumns = 96
const minRows = 6
const maxRows = 64
const defaultCellSize = 32
const minCellSize = 12
const maxCellSize = 64

// Share 行: 「ラベル  X,Y  WxH  #color」(ラベルに空白可、末尾から確定的に解釈)
const SHARE_LINE_RE =
  /^(.*?)\s+(\d+),(\d+)\s+(\d+)x(\d+)\s+(#[0-9a-fA-F]{3,8})\s*$/

const colorPalette = [
  // Reds / Pinks
  ['#dc2626', '#ef4444', '#f87171', '#f43f5e', '#e11d48', '#fb7185'],
  // Oranges / Yellows
  ['#ea580c', '#f97316', '#f59e0b', '#d97706', '#eab308', '#facc15'],
  // Greens / Teals
  ['#16a34a', '#22c55e', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e'],
  // Blues / Indigos
  ['#2563eb', '#3b82f6', '#6366f1', '#4f46e5', '#818cf8', '#a5b4fc'],
  // Purples / Violets
  ['#9333ea', '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff'],
  // Neutrals
  ['#374151', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6'],
]

// re-color 用グラデーション。並び順に沿って全ブロックへ補間配色する。
const gradientPresets: { name: string; stops: string[] }[] = [
  { name: 'Sunset', stops: ['#f43f5e', '#fb7185', '#fdba74', '#fde68a'] },
  { name: 'Ocean', stops: ['#0d9488', '#2563eb', '#6366f1'] },
  {
    name: 'Rainbow',
    stops: ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'],
  },
  { name: 'Forest', stops: ['#14532d', '#16a34a', '#86efac'] },
  { name: 'Mono', stops: ['#374151', '#9ca3af', '#e5e7eb'] },
]

const initialBlocks: SpanBoxBlock[] = [
  {
    id: 'block-1',
    x: 2,
    y: 2,
    width: 5,
    height: 3,
    color: '#4ecdc4',
    label: 'agenda',
  },
  {
    id: 'block-2',
    x: 10,
    y: 4,
    width: 7,
    height: 2,
    color: '#ffbe3d',
    label: 'issue',
  },
  {
    id: 'block-3',
    x: 5,
    y: 10,
    width: 4,
    height: 5,
    color: '#5b8def',
    label: 'owner',
  },
]

const SpanBox = () => {
  const boardRef = useRef<HTMLDivElement>(null)
  const clipboardRef = useRef<SpanBoxBlock[]>([])
  // 作業内容 (ブロック・グリッド設定) はリロードで消えないよう localStorage に永続化する
  const [blocks, setBlocks] = useLocalStorage<SpanBoxBlock[]>(
    'spanbox:blocks',
    initialBlocks
  )
  const [gridColumns, setGridColumns] = useLocalStorage(
    'spanbox:cols',
    defaultColumns
  )
  const [gridRows, setGridRows] = useLocalStorage('spanbox:rows', defaultRows)
  const [cellSize, setCellSize] = useLocalStorage(
    'spanbox:cell',
    defaultCellSize
  )
  const [showMeta, setShowMeta] = useLocalStorage('spanbox:showMeta', true)

  // 作業内容のスナップショット履歴。連続編集で溢れないよう「変化あり かつ
  // 前回記録から 4 秒以上」で間引き、上限 40 件 (ブックマークは除外されない)。
  const history = useHistory<SpanBoxBlock[]>('spanbox:history', {
    shouldRecord: combineAll(recordOnChange(), recordOnInterval(4000)),
    max: 40,
    label: (bs) => `${bs.length} blocks`,
  })
  // --- Undo / Redo (blocks の編集ごとの細かい履歴) ---
  const undoPast = useRef<SpanBoxBlock[][]>([])
  const undoFuture = useRef<SpanBoxBlock[][]>([])
  const prevBlocksRef = useRef(blocks)
  const isTimeTravel = useRef(false)
  // ドラッグ移動/リサイズは pointermove ごとに setBlocks するので 1 ドラッグ =
  // 1 undo にまとめる。開始時の状態を保持し、終了時に 1 回だけ過去へ積む。
  const dragActiveRef = useRef(false)
  const dragUndoSnapshot = useRef<SpanBoxBlock[] | null>(null)
  // TEXT 編集中はスナップショットを積まず、blur (確定) で 1 件だけ残す
  const textEditingRef = useRef(false)
  // restore 由来の blocks 変化では新規スナップショットを作らない (1 回だけ抑制)
  const skipSnapshotRef = useRef(false)
  // 現在ライブ状態が対応するスナップショット id。restore で過去に「駐機」すると、
  // それより新しい (先の) エントリは履歴上で先 (redo 相当) としてグレー表示する。
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null)

  // record は毎レンダー生成されるため ref 経由で呼び、effect の依存を blocks に絞る。
  // この effect は下の undo 追跡 effect より先に走る必要がある (フラグを読んでから消す)。
  const recordHistoryRef = useRef(history.record)
  recordHistoryRef.current = history.record
  useEffect(() => {
    // undo/redo の往復はスナップショット履歴に積まない
    if (isTimeTravel.current) return
    // TEXT 編集中は積まない (blur 時に force 記録する)
    if (textEditingRef.current) return
    // restore 由来は新規スナップショットを作らない (現在位置は維持)
    if (skipSnapshotRef.current) {
      skipSnapshotRef.current = false
      return
    }
    recordHistoryRef.current(blocks)
    // 通常編集をしたら最新 (ライブ) に戻る = 駐機解除
    setActiveHistoryId(null)
  }, [blocks])

  // blocks の変化を監視し、ユーザー操作なら過去スタックへ積む (undo/redo 由来は除外)
  useEffect(() => {
    if (isTimeTravel.current) {
      isTimeTravel.current = false
      prevBlocksRef.current = blocks
      return
    }
    // ドラッグ中は積まず prev だけ進める (終了時にまとめて積む)
    if (dragActiveRef.current) {
      prevBlocksRef.current = blocks
      return
    }
    if (prevBlocksRef.current !== blocks) {
      undoPast.current = [...undoPast.current, prevBlocksRef.current].slice(
        -100
      )
      undoFuture.current = []
      prevBlocksRef.current = blocks
    }
  }, [blocks])

  // ドラッグ開始: 開始前の状態を保持
  const beginDragUndo = () => {
    dragActiveRef.current = true
    dragUndoSnapshot.current = prevBlocksRef.current
  }
  // ドラッグ終了: 変化があれば開始時状態を 1 回だけ過去へ積む
  const endDragUndo = () => {
    if (!dragActiveRef.current) return
    dragActiveRef.current = false
    const snapshot = dragUndoSnapshot.current
    dragUndoSnapshot.current = null
    if (snapshot && snapshot !== prevBlocksRef.current) {
      undoPast.current = [...undoPast.current, snapshot].slice(-100)
      undoFuture.current = []
    }
  }

  // 選択を現存ブロックだけに整える (undo/redo で消えた id を除く)
  const sanitizeSelection = (next: SpanBoxBlock[]) =>
    setSelectedIds((prev) => prev.filter((id) => next.some((b) => b.id === id)))

  const undo = () => {
    if (undoPast.current.length === 0) return
    const prev = undoPast.current[undoPast.current.length - 1]
    undoPast.current = undoPast.current.slice(0, -1)
    undoFuture.current = [...undoFuture.current, prevBlocksRef.current]
    isTimeTravel.current = true
    setBlocks(prev)
    sanitizeSelection(prev)
  }

  const redo = () => {
    if (undoFuture.current.length === 0) return
    const next = undoFuture.current[undoFuture.current.length - 1]
    undoFuture.current = undoFuture.current.slice(0, -1)
    undoPast.current = [...undoPast.current, prevBlocksRef.current]
    isTimeTravel.current = true
    setBlocks(next)
    sanitizeSelection(next)
  }

  // 履歴から復元: 並びは変えずその場に「駐機」し、現在位置として記録する。
  // (新規スナップショットは作らないが、undo スタックには載るので Cmd+Z で戻れる)
  const restoreHistory = (id: string) => {
    const entry = history.entries.find((e) => e.id === id)
    if (!entry) return
    skipSnapshotRef.current = true
    setBlocks(entry.value)
    setActiveHistoryId(id)
    setSelectedIds(entry.value[0] ? [entry.value[0].id] : [])
  }

  // 復元したブロックの最大連番から採番を再開し、リロード後の ID 衝突を防ぐ
  const nextIdRef = useRef(
    Math.max(0, ...blocks.map((b) => Number(b.id.replace('block-', '')) || 0)) +
      1
  )
  const [selectedIds, setSelectedIds] = useState<string[]>(() => [
    blocks[0]?.id ?? initialBlocks[0].id,
  ])
  const [shareDraft, setShareDraft] = useState<string | null>(null)
  const [dragAction, setDragAction] = useState<DragAction | null>(null)
  // Inspector の表示設定 (永続化)
  const [paletteOpen, setPaletteOpen] = useLocalStorage(
    'spanbox:paletteOpen',
    false
  )
  // Activity Bar で開く左サイドパネル (VSCode 風に 1 つだけ開く)。
  // 表示中は SidePanel | Board | Inspector の 3 カラム (Board がプレビュー役)。
  // スマホではサイドパネルと Board のトグル切替になる。
  const [sidePanel, setSidePanel] = useLocalStorage<
    'none' | 'text' | 'blocks' | 'history'
  >('spanbox:sidePanel', 'none')
  const panelOpen = sidePanel !== 'none'
  // 同じパネルをもう一度押したら閉じる
  const toggleSidePanel = (panel: 'text' | 'blocks' | 'history') =>
    setSidePanel((current) => (current === panel ? 'none' : panel))
  // レイヤー一覧のドラッグ並び替え中の id
  const [dragLayerId, setDragLayerId] = useState<string | null>(null)
  // re-color プリセットのホバープレビュー (id→色)。確定はしない。
  const [previewColors, setPreviewColors] = useState<Record<
    string,
    string
  > | null>(null)
  // ツールバーの「その他」メニュー (転置・サイズ表示などをまとめる)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    window.addEventListener('pointerdown', onDown)

    return () => window.removeEventListener('pointerdown', onDown)
  }, [menuOpen])

  // ドラッグした行を、ドロップ先の行の位置へ差し込む (一覧は手前=上の逆順表示)
  const dropLayer = (targetId: string) => {
    if (!dragLayerId || dragLayerId === targetId) {
      setDragLayerId(null)
      return
    }
    setBlocks((current) => {
      const displayed = [...current].reverse()
      return reorderById(displayed, dragLayerId, targetId).reverse()
    })
    setDragLayerId(null)
  }

  // ブックマークを先頭に固定して埋もれないようにする (各群内は新しい順を維持)
  const pinnedHistory = useMemo(
    () => [
      ...history.entries.filter((e) => e.bookmarked),
      ...history.entries.filter((e) => !e.bookmarked),
    ],
    [history.entries]
  )

  // 列/行は即時反映せず、自由入力 → submit でバリデーション。
  // ブロックがはみ出す縮小は弾く (勝手にクランプしない)。
  const [gridDraft, setGridDraft] = useState({
    cols: String(gridColumns),
    rows: String(gridRows),
  })
  // 外部変更 (転置・復元) に追従して下書きを同期
  useEffect(() => {
    setGridDraft({ cols: String(gridColumns), rows: String(gridRows) })
  }, [gridColumns, gridRows])

  // 全ブロックを収めるのに必要な最小の列/行
  const neededCols = Math.max(1, ...blocks.map((b) => b.x + b.width))
  const neededRows = Math.max(1, ...blocks.map((b) => b.y + b.height))
  const draftCols = Number(gridDraft.cols)
  const draftRows = Number(gridDraft.rows)
  const gridError = !Number.isInteger(draftCols)
    ? '列は整数で'
    : !Number.isInteger(draftRows)
      ? '行は整数で'
      : draftCols < minColumns || draftCols > maxColumns
        ? `列は ${minColumns}〜${maxColumns}`
        : draftRows < minRows || draftRows > maxRows
          ? `行は ${minRows}〜${maxRows}`
          : draftCols < neededCols
            ? `列が不足 (最小 ${neededCols})`
            : draftRows < neededRows
              ? `行が不足 (最小 ${neededRows})`
              : null
  const gridDirty = draftCols !== gridColumns || draftRows !== gridRows
  const submitGrid = () => {
    if (gridError) return
    setGridColumns(draftCols)
    setGridRows(draftRows)
  }

  // 転置: グリッドと全ブロックの縦横 (x↔y, width↔height) を入れ替える
  const transpose = () => {
    const cols = gridRows
    const rows = gridColumns
    setGridColumns(cols)
    setGridRows(rows)
    setBlocks((current) =>
      current.map((block) => {
        const width = clamp(block.height, minBlockSize, cols)
        const height = clamp(block.width, minBlockSize, rows)
        return {
          ...block,
          width,
          height,
          x: clamp(block.y, 0, cols - width),
          y: clamp(block.x, 0, rows - height),
        }
      })
    )
  }

  // primary = 最後に選択したブロック (インスペクタ編集の対象)。未選択なら undefined。
  const primaryId = selectedIds[selectedIds.length - 1]
  const selectedBlock = primaryId
    ? blocks.find((block) => block.id === primaryId)
    : undefined

  // 選択解除 (空白クリック / Esc など共通の入口)
  const clearSelection = () => setSelectedIds([])

  const generateShareText = (blocks: SpanBoxBlock[]) =>
    blocks
      .map(
        (b) =>
          `${b.label.padEnd(8)} ${b.x + 1},${b.y + 1}  ${b.width}x${b.height}  ${b.color}`
      )
      .join('\n')

  const copyShareText = useCallback(async () => {
    await navigator.clipboard.writeText(generateShareText(blocks))
  }, [blocks])

  // Share テキストを直接編集 → 各行をパースしてブロックへ逆反映する。
  // 行頭から「ラベル X,Y WxH #color」。不正な行は無視し、最低1行有効なときだけ反映。
  const handleShareChange = (text: string) => {
    setShareDraft(text)
    const parsed: SpanBoxBlock[] = []
    for (const line of text.split('\n')) {
      const m = line.match(SHARE_LINE_RE)
      if (!m) continue
      const [, label, xs, ys, ws, hs, color] = m
      const width = clamp(Number(ws), minBlockSize, gridColumns)
      const height = clamp(Number(hs), minBlockSize, gridRows)
      // ID は行位置で既存ブロックを引き継ぎ、新規行は採番する
      const id = blocks[parsed.length]?.id ?? `block-${nextIdRef.current++}`
      parsed.push({
        id,
        label: label.trim(),
        color,
        width,
        height,
        x: clamp(Number(xs) - 1, 0, gridColumns - width),
        y: clamp(Number(ys) - 1, 0, gridRows - height),
      })
    }
    if (parsed.length === 0) return
    setBlocks(parsed)
    setSelectedIds((prev) => {
      const valid = prev.filter((id) => parsed.some((p) => p.id === id))
      return valid.length > 0 ? valid : [parsed[0].id]
    })
  }
  const occupiedCells = useMemo(() => getOccupiedCells(blocks), [blocks])
  // 自分より手前 (配列で後ろ) のブロックに重なられている = 裏に隠れている
  const occludedIds = useMemo(() => getOccludedIds(blocks), [blocks])

  // 重なり順 (配列順) を入れ替える。手前 = 配列末尾。
  const moveStack = (id: string, dir: StackDirection) =>
    setBlocks((current) => stackMove(current, id, dir))

  // 指定ブロックのラベルを更新 (Blocks パネルからの名前編集用)
  const updateBlockLabel = (id: string, label: string) =>
    setBlocks((current) =>
      current.map((block) => (block.id === id ? { ...block, label } : block))
    )

  // 指定ブロックを削除 (最後の 1 つは残す)
  const removeBlock = (id: string) => {
    setBlocks((current) =>
      current.length <= 1 ? current : current.filter((block) => block.id !== id)
    )
    setSelectedIds((prev) => prev.filter((sid) => sid !== id))
  }

  // ロック切り替え (ロック中は re-color の対象外)
  const toggleLock = (id: string) =>
    setBlocks((current) =>
      current.map((block) =>
        block.id === id ? { ...block, locked: !block.locked } : block
      )
    )

  // 並び順 (一覧=手前から) に沿ってグラデーションを割り当てた id→色 を作る。
  // ロック中のブロックは対象から除外し色を保持する。
  const computeRecolor = (stops: string[]): Record<string, string> => {
    const ordered = [...blocks].reverse().filter((b) => !b.locked)
    const colors = gradientColors(stops, ordered.length)

    return Object.fromEntries(ordered.map((b, i) => [b.id, colors[i]]))
  }

  const applyRecolor = (stops: string[]) => {
    const colorById = computeRecolor(stops)
    setBlocks((current) =>
      current.map((b) =>
        colorById[b.id] ? { ...b, color: colorById[b.id] } : b
      )
    )
    setPreviewColors(null)
  }

  const updateSelectedBlock = (updates: Partial<SpanBoxBlock>) => {
    if (!selectedBlock) return
    setBlocks((currentBlocks) =>
      currentBlocks.map((block) =>
        block.id === selectedBlock.id ? { ...block, ...updates } : block
      )
    )
  }

  const addBlock = () => {
    const block: SpanBoxBlock = {
      id: `block-${nextIdRef.current}`,
      x: 1 + ((nextIdRef.current * 3) % 18),
      y: 1 + ((nextIdRef.current * 2) % 12),
      width: 4,
      height: 3,
      color:
        colorPalette.flat()[nextIdRef.current % colorPalette.flat().length],
      label: `note ${nextIdRef.current}`,
    }
    nextIdRef.current += 1
    setBlocks((currentBlocks) => [...currentBlocks, block])
    setSelectedIds([block.id])
  }

  // 選択中の全ブロックを +1,+1 ずらして複製し、複製側を選択する
  const duplicateSelected = () => {
    const targets = blocks.filter((b) => selectedIds.includes(b.id))
    if (targets.length === 0) return
    const dups = targets.map((b) => ({
      ...b,
      id: `block-${nextIdRef.current++}`,
      x: clamp(b.x + 1, 0, gridColumns - b.width),
      y: clamp(b.y + 1, 0, gridRows - b.height),
    }))
    setBlocks((currentBlocks) => [...currentBlocks, ...dups])
    setSelectedIds(dups.map((d) => d.id))
  }

  const deleteSelected = () => {
    if (selectedIds.length === 0) return
    const remaining = blocks.filter((b) => !selectedIds.includes(b.id))
    if (remaining.length === 0) return
    setBlocks(remaining)
    clearSelection()
  }

  const startMove = (event: React.PointerEvent, block: SpanBoxBlock) => {
    if (isControlTarget(event.target)) return
    // 修飾キー押下時は選択のトグルのみ (ドラッグ移動しない)
    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      setSelectedIds((cur) =>
        cur.includes(block.id)
          ? cur.filter((id) => id !== block.id)
          : [...cur, block.id]
      )
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    beginDragUndo()
    let ids = selectedIds.includes(block.id) ? selectedIds : [block.id]
    let snapshot = blocks.filter((b) => ids.includes(b.id))
    // Alt ドラッグ: 複製して複製側をドラッグ (元は据え置き)
    if (event.altKey) {
      const dups = snapshot.map((b) => ({
        ...b,
        id: `block-${nextIdRef.current++}`,
      }))
      setBlocks((currentBlocks) => [...currentBlocks, ...dups])
      ids = dups.map((d) => d.id)
      snapshot = dups
    }
    setSelectedIds(ids)
    setDragAction({
      kind: 'move',
      origin: getGridPoint(event, cellSize),
      snapshot,
    })
  }

  const startResize = (
    event: React.PointerEvent,
    block: SpanBoxBlock,
    edge: ResizeEdge
  ) => {
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    beginDragUndo()
    const ids = selectedIds.includes(block.id) ? selectedIds : [block.id]
    setSelectedIds(ids)
    setDragAction({
      kind: 'resize',
      edge,
      origin: getGridPoint(event, cellSize),
      snapshot: blocks.filter((b) => ids.includes(b.id)),
    })
  }

  const dragBlock = (event: React.PointerEvent) => {
    if (!dragAction) return
    const currentPoint = getGridPoint(event, cellSize)
    const delta = {
      x: currentPoint.x - dragAction.origin.x,
      y: currentPoint.y - dragAction.origin.y,
    }
    // 選択中の全ブロックへ delta を適用 (移動は群として境界クランプ)
    const updated =
      dragAction.kind === 'move'
        ? moveGroup(dragAction.snapshot, delta, gridColumns, gridRows)
        : dragAction.snapshot.map((b) =>
            resizeBlock(b, delta, dragAction.edge, gridColumns, gridRows)
          )
    const updatedMap = new Map(updated.map((b) => [b.id, b]))

    setBlocks((currentBlocks) =>
      currentBlocks.map((block) => updatedMap.get(block.id) ?? block)
    )
  }

  // Cmd/Ctrl + C / V で選択ブロックをコピー&ペースト (入力中は無視)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return
      }
      // Esc で選択解除 (修飾キー不要)
      if (event.key === 'Escape') {
        clearSelection()
        return
      }
      // Delete / Backspace で選択ブロックを削除 (修飾キー不要)
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedIds.length > 0) {
          event.preventDefault()
          deleteSelected()
        }
        return
      }
      if (!(event.metaKey || event.ctrlKey)) return

      // Cmd/Ctrl+Z で undo、Cmd/Ctrl+Shift+Z または Cmd/Ctrl+Y で redo
      if (event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
        return
      }
      if ((event.key === 'z' && event.shiftKey) || event.key === 'y') {
        event.preventDefault()
        redo()
        return
      }

      if (event.key === 'c') {
        clipboardRef.current = blocks.filter((b) => selectedIds.includes(b.id))
      } else if (event.key === 'v') {
        const clip = clipboardRef.current
        if (clip.length === 0) return
        event.preventDefault()
        const dups = clip.map((b) => ({
          ...b,
          id: `block-${nextIdRef.current++}`,
          x: clamp(b.x + 1, 0, gridColumns - b.width),
          y: clamp(b.y + 1, 0, gridRows - b.height),
        }))
        setBlocks((currentBlocks) => [...currentBlocks, ...dups])
        setSelectedIds(dups.map((d) => d.id))
      }
    }
    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [blocks, selectedIds, gridColumns, gridRows])

  return (
    <Shell>
      <TopBar>
        <Brand>
          <TitleText>SpanBox</TitleText>
          <SubtitleText>
            cell-spanning blocks for flexible whiteboard layouts
          </SubtitleText>
        </Brand>

        <ToolbarGroup>
          <PrimaryButton onClick={addBlock}>
            <FaPlus />
            Add
          </PrimaryButton>
          <ToolButton onClick={undo} title="元に戻す (Cmd/Ctrl+Z)">
            <FaUndo />
          </ToolButton>
          <ToolButton onClick={redo} title="やり直す (Cmd/Ctrl+Shift+Z)">
            <FaRedo />
          </ToolButton>
          <ToolButton
            onClick={duplicateSelected}
            disabled={selectedIds.length === 0}
            title="選択ブロックを複製"
          >
            <FaCopy />
          </ToolButton>
          <ToolButton
            onClick={deleteSelected}
            disabled={
              selectedIds.length === 0 || blocks.length <= selectedIds.length
            }
            title="選択ブロックを削除"
          >
            <FaTrash />
          </ToolButton>
          <MoreMenuWrap ref={menuRef}>
            <ToolButton
              onClick={() => setMenuOpen((v) => !v)}
              $active={menuOpen}
              title="その他"
            >
              <FaEllipsisV />
            </ToolButton>
            {menuOpen && (
              <MoreMenu>
                <MenuItem
                  type="button"
                  onClick={() => {
                    transpose()
                    setMenuOpen(false)
                  }}
                >
                  <FaRetweet />
                  縦横を入れ替える (転置)
                </MenuItem>
                <MenuItem type="button" onClick={() => setShowMeta((v) => !v)}>
                  {showMeta ? <FaEye /> : <FaEyeSlash />}
                  ブロックにサイズ表示
                </MenuItem>
              </MoreMenu>
            )}
          </MoreMenuWrap>

          <GridSizeControls
            as="form"
            onSubmit={(event) => {
              event.preventDefault()
              submitGrid()
            }}
          >
            <GridField>
              <span>列</span>
              <GridNumberInput
                type="number"
                value={gridDraft.cols}
                $invalid={!!gridError && draftCols !== gridColumns}
                onChange={(event) =>
                  setGridDraft((d) => ({ ...d, cols: event.target.value }))
                }
              />
            </GridField>
            <GridField>
              <span>行</span>
              <GridNumberInput
                type="number"
                value={gridDraft.rows}
                $invalid={!!gridError && draftRows !== gridRows}
                onChange={(event) =>
                  setGridDraft((d) => ({ ...d, rows: event.target.value }))
                }
              />
            </GridField>
            <SubmitGridButton
              type="submit"
              disabled={!!gridError || !gridDirty}
              title={gridError ?? '列/行を適用'}
            >
              {gridError ?? '適用'}
            </SubmitGridButton>
            <GridField>
              <span>セル</span>
              <GridNumberInput
                type="number"
                min={minCellSize}
                max={maxCellSize}
                step={2}
                value={cellSize}
                onChange={(event) =>
                  setCellSize(
                    clamp(
                      Number(event.target.value) || defaultCellSize,
                      minCellSize,
                      maxCellSize
                    )
                  )
                }
              />
            </GridField>
          </GridSizeControls>
        </ToolbarGroup>
      </TopBar>

      <Workspace $open={panelOpen}>
        {/* VSCode 風アクティビティバー: 左サイドパネル (TEXT / Blocks) の切替 */}
        <ActivityBar>
          <ActivityButton
            type="button"
            $active={sidePanel === 'text'}
            onClick={() => toggleSidePanel('text')}
            title="TEXT エディタ"
          >
            <FaFileAlt />
            <span>TEXT</span>
          </ActivityButton>
          <ActivityButton
            type="button"
            $active={sidePanel === 'blocks'}
            onClick={() => toggleSidePanel('blocks')}
            title="Blocks 一覧"
          >
            <FaLayerGroup />
            <span>LIST</span>
          </ActivityButton>
          <ActivityButton
            type="button"
            $active={sidePanel === 'history'}
            onClick={() => toggleSidePanel('history')}
            title="作業履歴"
          >
            <FaHistory />
            <span>HIST</span>
          </ActivityButton>
        </ActivityBar>
        {sidePanel === 'text' && (
          <SidePanel>
            <SidePanelHead>
              <span>TEXT</span>
              <CopyButton onClick={copyShareText}>
                <FaCopy />
                Copy
              </CopyButton>
            </SidePanelHead>
            <TextPanelArea
              value={shareDraft ?? generateShareText(blocks)}
              onFocus={() => {
                setShareDraft(generateShareText(blocks))
                // 編集中は自動記録を止め、編集前の状態を 1 undo に集約
                textEditingRef.current = true
                beginDragUndo()
              }}
              onBlur={() => {
                setShareDraft(null)
                textEditingRef.current = false
                endDragUndo()
                // 確定タイミングで履歴に 1 件だけ残す (変化があれば)
                history.record(blocks, { force: true })
              }}
              onChange={(event) => handleShareChange(event.target.value)}
              spellCheck={false}
            />
          </SidePanel>
        )}
        {sidePanel === 'blocks' && (
          <SidePanel>
            <SidePanelHead>
              <span>LIST ({blocks.length})</span>
            </SidePanelHead>
            <LayerList>
              {blocks
                .map((block, index) => ({ block, index }))
                .reverse()
                .map(({ block, index }) => {
                  const isSelected = selectedIds.includes(block.id)
                  const isFront = index === blocks.length - 1
                  const isBack = index === 0
                  return (
                    <LayerRow
                      key={block.id}
                      $selected={isSelected}
                      $dragging={dragLayerId === block.id}
                      draggable
                      onDragStart={() => setDragLayerId(block.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => dropLayer(block.id)}
                      onDragEnd={() => setDragLayerId(null)}
                    >
                      <DragHandle title="ドラッグで並び替え">⠿</DragHandle>
                      <LayerColorDot
                        $color={previewColors?.[block.id] ?? block.color}
                      />
                      <NameInput
                        value={block.label}
                        placeholder="(no label)"
                        onFocus={() => setSelectedIds([block.id])}
                        onChange={(event) =>
                          updateBlockLabel(block.id, event.target.value)
                        }
                      />
                      {occludedIds.has(block.id) && <LayerTag>隠</LayerTag>}
                      <MiniButton
                        onClick={() => toggleLock(block.id)}
                        $active={block.locked}
                        title={block.locked ? 'ロック解除' : 'ロック (色固定)'}
                      >
                        {block.locked ? <FaLock /> : <FaLockOpen />}
                      </MiniButton>
                      <MiniButton
                        onClick={() => moveStack(block.id, 'forward')}
                        disabled={isFront}
                        title="手前へ"
                      >
                        <FaChevronUp />
                      </MiniButton>
                      <MiniButton
                        onClick={() => moveStack(block.id, 'backward')}
                        disabled={isBack}
                        title="奥へ"
                      >
                        <FaChevronDown />
                      </MiniButton>
                      <MiniButton
                        onClick={() => removeBlock(block.id)}
                        disabled={blocks.length <= 1}
                        title="削除"
                      >
                        <FaTrash />
                      </MiniButton>
                    </LayerRow>
                  )
                })}
            </LayerList>
            {/* re-color は使用頻度が低いのでフッターに控えめに置く */}
            <RecolorBar>
              <span>re-color</span>
              {gradientPresets.map((preset) => (
                <RecolorButton
                  key={preset.name}
                  type="button"
                  $stops={preset.stops}
                  title={`${preset.name} (ロックは除外)`}
                  onPointerEnter={() =>
                    setPreviewColors(computeRecolor(preset.stops))
                  }
                  onPointerLeave={() => setPreviewColors(null)}
                  onClick={() => applyRecolor(preset.stops)}
                />
              ))}
            </RecolorBar>
          </SidePanel>
        )}
        {sidePanel === 'history' && (
          <SidePanel>
            <SidePanelHead>
              <span>HISTORY</span>
            </SidePanelHead>
            <HistoryPanel
              entries={pinnedHistory}
              now={Date.now()}
              activeId={activeHistoryId}
              onRestore={restoreHistory}
              onToggleBookmark={history.toggleBookmark}
              onRemove={history.remove}
              onClear={history.clear}
            />
          </SidePanel>
        )}
        <BoardPanel $open={panelOpen}>
          <Board
            ref={boardRef}
            onPointerMove={dragBlock}
            onPointerUp={() => {
              endDragUndo()
              setDragAction(null)
            }}
            onPointerCancel={() => {
              endDragUndo()
              setDragAction(null)
            }}
          >
            <ColumnRail $cols={gridColumns} $cell={cellSize}>
              {Array.from({ length: gridColumns }, (_, index) => (
                <RailTick key={index}>{index + 1}</RailTick>
              ))}
            </ColumnRail>
            <RowRail $rows={gridRows} $cell={cellSize}>
              {Array.from({ length: gridRows }, (_, index) => (
                <RailTick key={index}>{index + 1}</RailTick>
              ))}
            </RowRail>
            <GridPaper
              $cols={gridColumns}
              $rows={gridRows}
              $cell={cellSize}
              onPointerDown={(event) => {
                // 空白 (グリッド地そのもの) を押したら選択解除
                if (event.target === event.currentTarget) clearSelection()
              }}
            >
              {occupiedCells.map((cell) => (
                <GhostCell key={cell} />
              ))}
              {/* 本体はレイヤー順 (配列順) を維持して描画。手前のものが重なりを覆う */}
              {blocks.map((block) => (
                <BlockItem
                  key={block.id}
                  $block={block}
                  $color={previewColors?.[block.id]}
                  $cell={cellSize}
                  onPointerDown={(event) => startMove(event, block)}
                >
                  <BlockLabel>{block.label}</BlockLabel>
                  {/* サイズは選択中ブロックだけ小さく表示 (常時表示しない) */}
                  {showMeta && selectedIds.includes(block.id) && (
                    <BlockMeta>
                      {block.width}×{block.height}
                    </BlockMeta>
                  )}
                </BlockItem>
              ))}
              {/* 選択枠とリサイズハンドルは最前面のオーバーレイに出す。
                  本体を持ち上げないので重なり順は維持しつつ、覆われていても
                  枠 (覆われ時は点線) とハンドルが見えて操作できる */}
              {blocks
                .filter((block) => selectedIds.includes(block.id))
                .map((block) => (
                  <SelectionOverlay
                    key={block.id}
                    $block={block}
                    $cell={cellSize}
                    $occluded={occludedIds.has(block.id)}
                  >
                    {(
                      [
                        'top',
                        'right',
                        'bottom',
                        'left',
                        'top-left',
                        'top-right',
                        'bottom-left',
                        'bottom-right',
                      ] as ResizeEdge[]
                    ).map((edge) => (
                      <ResizeHandle
                        key={edge}
                        $edge={edge}
                        onPointerDown={(event) =>
                          startResize(event, block, edge)
                        }
                        aria-label={`resize ${edge}`}
                      />
                    ))}
                  </SelectionOverlay>
                ))}
            </GridPaper>
          </Board>
        </BoardPanel>

        <Inspector>
          <PanelTitle>Selected</PanelTitle>
          {selectedBlock && (
            <>
              <FieldLabel>
                <FaFont />
                Label
              </FieldLabel>
              <LabelInput
                value={selectedBlock.label}
                onChange={(event) =>
                  updateSelectedBlock({ label: event.target.value })
                }
              />

              <CollapseHeader
                type="button"
                onClick={() => setPaletteOpen((v) => !v)}
              >
                <FaPalette />
                Color
                {paletteOpen ? <FaChevronUp /> : <FaChevronDown />}
              </CollapseHeader>
              {paletteOpen && (
                <Swatches>
                  {colorPalette.map((row) =>
                    row.map((color) => (
                      <SwatchButton
                        key={color}
                        $color={color}
                        $selected={selectedBlock.color === color}
                        onClick={() => updateSelectedBlock({ color })}
                      />
                    ))
                  )}
                </Swatches>
              )}
              <CustomColorRow>
                <ColorInput
                  type="color"
                  value={selectedBlock.color}
                  onChange={(e) =>
                    updateSelectedBlock({ color: e.target.value })
                  }
                />
                <HexInput
                  value={selectedBlock.color}
                  onChange={(e) => {
                    const val = e.target.value
                    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                      updateSelectedBlock({ color: val })
                    }
                  }}
                  placeholder="#hex"
                />
              </CustomColorRow>

              <StatsGrid>
                <StatBox>
                  <span>X</span>
                  <strong>{selectedBlock.x + 1}</strong>
                </StatBox>
                <StatBox>
                  <span>Y</span>
                  <strong>{selectedBlock.y + 1}</strong>
                </StatBox>
                <StatBox>
                  <span>W</span>
                  <strong>{selectedBlock.width}</strong>
                </StatBox>
                <StatBox>
                  <span>H</span>
                  <strong>{selectedBlock.height}</strong>
                </StatBox>
              </StatsGrid>

              {/* 使用頻度が低いので一番下に置く */}
              <FieldLabel>Size preset</FieldLabel>
              <SelectInput
                value={`${selectedBlock.width}x${selectedBlock.height}`}
                onChange={(event) => {
                  const [width, height] = String(event.target.value)
                    .split('x')
                    .map(Number)
                  updateSelectedBlock({
                    width,
                    height,
                    x: clamp(selectedBlock.x, 0, gridColumns - width),
                    y: clamp(selectedBlock.y, 0, gridRows - height),
                  })
                }}
              >
                <option
                  value={`${selectedBlock.width}x${selectedBlock.height}`}
                >
                  Current: {selectedBlock.width} x {selectedBlock.height}
                </option>
                <option value="3x2">3 x 2</option>
                <option value="4x3">4 x 3</option>
                <option value="5x3">5 x 3</option>
                <option value="6x3">6 x 3</option>
                <option value="7x2">7 x 2</option>
                <option value="8x4">8 x 4</option>
              </SelectInput>
            </>
          )}

          {/* Blocks 一覧と History は Activity Bar の LIST / HIST パネルへ移動 */}
          {!selectedBlock && <Hint>ブロックを選択すると編集できます</Hint>}
        </Inspector>
      </Workspace>
    </Shell>
  )
}

const getOccupiedCells = (blocks: SpanBoxBlock[]) =>
  blocks.flatMap((block) =>
    Array.from({ length: block.width * block.height }, (_, index) => {
      const x = block.x + (index % block.width)
      const y = block.y + Math.floor(index / block.width)
      return `${x}-${y}`
    })
  )

type StackDirection = 'front' | 'back' | 'forward' | 'backward'

// 2 つのブロック矩形が 1 セルでも重なるか
const rectsOverlap = (a: SpanBoxBlock, b: SpanBoxBlock): boolean =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height

// 自分より手前 (配列で後ろ) に重なるブロックがある id の集合 = 裏に隠れている
const getOccludedIds = (blocks: SpanBoxBlock[]): Set<string> => {
  const occluded = new Set<string>()
  blocks.forEach((block, index) => {
    const coveredByUpper = blocks
      .slice(index + 1)
      .some((upper) => rectsOverlap(block, upper))
    if (coveredByUpper) occluded.add(block.id)
  })

  return occluded
}

// 重なり順を入れ替える (immutable)。手前 = 配列末尾。
const stackMove = (
  blocks: SpanBoxBlock[],
  id: string,
  dir: StackDirection
): SpanBoxBlock[] => {
  const index = blocks.findIndex((b) => b.id === id)
  if (index < 0) return blocks
  const next = [...blocks]
  const [item] = next.splice(index, 1)
  if (dir === 'front') next.push(item)
  else if (dir === 'back') next.unshift(item)
  else if (dir === 'forward') {
    next.splice(Math.min(index + 1, blocks.length - 1), 0, item)
  } else {
    next.splice(Math.max(index - 1, 0), 0, item)
  }

  return next
}

// ドラッグした id を、ドロップ先 id の位置へ差し込む (immutable)。
const reorderById = (
  blocks: SpanBoxBlock[],
  draggedId: string,
  targetId: string
): SpanBoxBlock[] => {
  const from = blocks.findIndex((b) => b.id === draggedId)
  const to = blocks.findIndex((b) => b.id === targetId)
  if (from < 0 || to < 0 || from === to) return blocks
  const next = [...blocks]
  const [item] = next.splice(from, 1)
  const targetIndex = next.findIndex((b) => b.id === targetId)
  next.splice(from < to ? targetIndex + 1 : targetIndex, 0, item)

  return next
}

const getGridPoint = (
  event: React.PointerEvent,
  cellSize: number
): GridPoint => ({
  x: Math.round(event.clientX / cellSize),
  y: Math.round(event.clientY / cellSize),
})

// 群移動: delta を群の外接矩形でクランプし、相対位置を保ったまま全員を動かす
const moveGroup = (
  snapshot: SpanBoxBlock[],
  delta: GridPoint,
  gridColumns: number,
  gridRows: number
): SpanBoxBlock[] => {
  if (snapshot.length === 0) return snapshot
  const minX = Math.min(...snapshot.map((b) => b.x))
  const minY = Math.min(...snapshot.map((b) => b.y))
  const maxRight = Math.max(...snapshot.map((b) => b.x + b.width))
  const maxBottom = Math.max(...snapshot.map((b) => b.y + b.height))
  const dx = clamp(delta.x, -minX, gridColumns - maxRight)
  const dy = clamp(delta.y, -minY, gridRows - maxBottom)

  return snapshot.map((b) => ({ ...b, x: b.x + dx, y: b.y + dy }))
}

const resizeBlock = (
  block: SpanBoxBlock,
  delta: GridPoint,
  edge: ResizeEdge,
  gridColumns: number,
  gridRows: number
): SpanBoxBlock => {
  if (edge === 'right') {
    return {
      ...block,
      width: clamp(block.width + delta.x, minBlockSize, gridColumns - block.x),
    }
  }
  if (edge === 'bottom') {
    return {
      ...block,
      height: clamp(block.height + delta.y, minBlockSize, gridRows - block.y),
    }
  }
  if (edge === 'left') {
    const nextX = clamp(
      block.x + delta.x,
      0,
      block.x + block.width - minBlockSize
    )
    return {
      ...block,
      x: nextX,
      width: block.width + block.x - nextX,
    }
  }
  if (edge === 'top') {
    const nextY = clamp(
      block.y + delta.y,
      0,
      block.y + block.height - minBlockSize
    )
    return {
      ...block,
      y: nextY,
      height: block.height + block.y - nextY,
    }
  }

  if (edge === 'top-left') {
    const nextX = clamp(
      block.x + delta.x,
      0,
      block.x + block.width - minBlockSize
    )
    const nextY = clamp(
      block.y + delta.y,
      0,
      block.y + block.height - minBlockSize
    )
    return {
      ...block,
      x: nextX,
      y: nextY,
      width: block.width + block.x - nextX,
      height: block.height + block.y - nextY,
    }
  }
  if (edge === 'top-right') {
    const nextY = clamp(
      block.y + delta.y,
      0,
      block.y + block.height - minBlockSize
    )
    return {
      ...block,
      y: nextY,
      width: clamp(block.width + delta.x, minBlockSize, gridColumns - block.x),
      height: block.height + block.y - nextY,
    }
  }
  if (edge === 'bottom-left') {
    const nextX = clamp(
      block.x + delta.x,
      0,
      block.x + block.width - minBlockSize
    )
    return {
      ...block,
      x: nextX,
      width: block.width + block.x - nextX,
      height: clamp(block.height + delta.y, minBlockSize, gridRows - block.y),
    }
  }

  return {
    ...block,
    width: clamp(block.width + delta.x, minBlockSize, gridColumns - block.x),
    height: clamp(block.height + delta.y, minBlockSize, gridRows - block.y),
  }
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

// #rrggbb → [r,g,b]
const hexToRgb = (hex: string): [number, number, number] => {
  const n = Number.parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const rgbToHex = (r: number, g: number, b: number): string =>
  `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`

// stops を n 個に線形補間したグラデーション色配列を返す。
const gradientColors = (stops: string[], n: number): string[] => {
  if (n <= 0) return []
  const rgbs = stops.map(hexToRgb)
  if (n === 1) return [rgbToHex(...rgbs[0])]

  return Array.from({ length: n }, (_, i) => {
    const seg = (i / (n - 1)) * (rgbs.length - 1)
    const idx = Math.min(Math.floor(seg), rgbs.length - 2)
    const t = seg - idx
    const [ar, ag, ab] = rgbs[idx]
    const [br, bg, bb] = rgbs[idx + 1]

    return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t)
  })
}

const isControlTarget = (target: EventTarget) =>
  target instanceof HTMLElement &&
  ['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(target.tagName)

const Shell = styled.div`
  min-height: calc(100vh - 40px);
  background: #f6f7fb;
  color: #202631;
  padding: 14px 6px;
`

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 1240px;
  margin: 0 auto 14px;

  @media (max-width: 720px) {
    align-items: flex-start;
    flex-direction: column;
  }
`

const Brand = styled.div`
  display: grid;
  gap: 2px;
`

const GridSizeControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 4px;
  padding-left: 10px;
  border-left: 1px solid #d7dde8;
`

const GridField = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #566174;
  font-size: 0.82rem;
  font-weight: 700;
`

const GridNumberInput = styled.input<{ $invalid?: boolean }>`
  width: 56px;
  height: 38px;
  box-sizing: border-box;
  border: 1px solid ${({ $invalid }) => ($invalid ? '#e11d48' : '#c7d0dd')};
  border-radius: 6px;
  padding: 0 8px;
  color: #202631;
  font-size: 0.9rem;
`

const SubmitGridButton = styled.button`
  height: 38px;
  padding: 0 12px;
  border: 1px solid #1e5fd8;
  border-radius: 6px;
  background: #256ee8;
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background: #1e5fd8;
  }

  &:disabled {
    border-color: #d7dde8;
    background: #eef1f6;
    color: #9aa3b2;
    cursor: not-allowed;
  }
`

const TitleText = styled.h1`
  margin: 0;
  color: #202631;
  font-size: 2.1rem;
  font-weight: 800;
  line-height: 1.1;
`

const SubtitleText = styled.p`
  margin: 0;
  color: #4f5c6f;
  font-size: 0.98rem;
`

const ToolbarGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
`

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid #1e5fd8;
  border-radius: 6px;
  background: #256ee8;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: #1e5fd8;
  }
`

const ToolButton = styled.button<{ $active?: boolean }>`
  display: inline-grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid ${({ $active }) => ($active ? '#1e5fd8' : '#c7d0dd')};
  border-radius: 6px;
  background: ${({ $active }) => ($active ? '#256ee8' : '#ffffff')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#202631')};
  cursor: pointer;

  &:hover {
    background: ${({ $active }) => ($active ? '#1e5fd8' : '#f0f4fa')};
  }

  &:disabled {
    color: #a1aaba;
    cursor: not-allowed;
  }
`

// 先頭にアクティビティバー(46px)。TEXT 列を開くと
// [rail | TEXT | Board | Inspector]、閉じると [rail | Board | Inspector]。
const Workspace = styled.div<{ $open: boolean }>`
  display: grid;
  grid-template-columns: ${({ $open }) =>
    $open
      ? '46px minmax(0, 320px) minmax(0, 1fr) 280px'
      : '46px minmax(0, 1fr) 280px'};
  gap: 12px;
  max-width: ${({ $open }) => ($open ? '1580px' : '1260px')};
  margin: 0 auto;

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`

const ActivityBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: stretch;
  padding: 6px;
  background: #20262f;
  border-radius: 8px;

  /* スマホでは横並びのトップバーになる */
  @media (max-width: 920px) {
    flex-direction: row;
  }
`

const ActivityButton = styled.button<{ $active: boolean }>`
  display: grid;
  place-items: center;
  gap: 3px;
  padding: 8px 2px;
  border: 0;
  border-radius: 6px;
  background: ${({ $active }) => ($active ? '#256ee8' : 'transparent')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#9aa6b6')};
  cursor: pointer;

  svg {
    font-size: 1.1rem;
  }
  span {
    font-size: 0.56rem;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  &:hover {
    background: ${({ $active }) => ($active ? '#256ee8' : '#2c3542')};
    color: #ffffff;
  }
`

const MoreMenuWrap = styled.div`
  position: relative;
  display: inline-flex;
`

const MoreMenu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 200;
  display: grid;
  gap: 2px;
  min-width: 220px;
  padding: 4px;
  background: #ffffff;
  border: 1px solid #c7d0dd;
  border-radius: 8px;
  box-shadow: 0 12px 28px rgba(31, 39, 54, 0.18);
`

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border: 0;
  border-radius: 6px;
  background: none;
  color: #202631;
  font-size: 0.84rem;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: #f0f4fa;
  }
`

const BoardPanel = styled.section<{ $open: boolean }>`
  min-width: 0;
  background: #ffffff;
  border: 1px solid #d7dde8;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 28px rgba(31, 39, 54, 0.08);

  /* スマホではサイドパネルを開いている間は Board を隠して切替表示にする */
  @media (max-width: 920px) {
    display: ${({ $open }) => ($open ? 'none' : 'block')};
  }
`

const SidePanel = styled.section`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #ffffff;
  border: 1px solid #d7dde8;
  border-radius: 8px;
  box-shadow: 0 10px 28px rgba(31, 39, 54, 0.08);
`

const SidePanelHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  span {
    color: #566174;
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
  }
`

const TextPanelArea = styled.textarea`
  width: 100%;
  flex: 1;
  min-height: 60vh;
  box-sizing: border-box;
  border: 1px solid #c7d0dd;
  border-radius: 6px;
  padding: 8px 10px;
  color: #202631;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 0.78rem;
  line-height: 1.6;
  resize: none;
  background: #f6f8fb;
`

const Board = styled.div`
  position: relative;
  overflow: auto;
  padding: 28px 0 0 34px;
  touch-action: none;
`

const ColumnRail = styled.div<{ $cols: number; $cell: number }>`
  position: absolute;
  top: 0;
  left: 34px;
  display: grid;
  grid-template-columns: repeat(
    ${({ $cols }) => $cols},
    ${({ $cell }) => $cell}px
  );
  height: 28px;
  background: #eef2f8;
`

const RowRail = styled.div<{ $rows: number; $cell: number }>`
  position: absolute;
  top: 28px;
  left: 0;
  display: grid;
  grid-template-rows: repeat(${({ $rows }) => $rows}, ${({ $cell }) => $cell}px);
  width: 34px;
  background: #eef2f8;
`

const RailTick = styled.div`
  display: grid;
  place-items: center;
  border-right: 1px solid #d7dde8;
  border-bottom: 1px solid #d7dde8;
  color: #667286;
  font-size: 0.68rem;
  font-weight: 700;
`

const GridPaper = styled.div<{ $cols: number; $rows: number; $cell: number }>`
  position: relative;
  width: ${({ $cols, $cell }) => $cols * $cell}px;
  height: ${({ $rows, $cell }) => $rows * $cell}px;
  background-color: #ffffff;
  background-image:
    linear-gradient(#dce2ec 1px, transparent 1px),
    linear-gradient(90deg, #dce2ec 1px, transparent 1px);
  background-size: ${({ $cell }) => $cell}px ${({ $cell }) => $cell}px;
`

const GhostCell = styled.div`
  display: none;
`

const BlockItem = styled.div<{
  $block: SpanBoxBlock
  $color?: string
  $cell: number
}>`
  position: absolute;
  left: ${({ $block, $cell }) => $block.x * $cell}px;
  top: ${({ $block, $cell }) => $block.y * $cell}px;
  width: ${({ $block, $cell }) => $block.width * $cell}px;
  height: ${({ $block, $cell }) => $block.height * $cell}px;
  display: grid;
  align-content: center;
  gap: 2px;
  padding: 8px 10px;
  border: 1px solid rgba(32, 38, 49, 0.22);
  /* $color は re-color プレビュー時の一時上書き */
  background: ${({ $block, $color }) => $color ?? $block.color};
  box-shadow: 0 5px 12px rgba(32, 38, 49, 0.13);
  color: #10141b;
  cursor: grab;
  user-select: none;
  overflow: hidden;

  &:active {
    cursor: grabbing;
  }
`

// 選択枠＋ハンドルの最前面オーバーレイ。本体の重なり順に関係なく見える。
// 覆われている (occluded) ときは枠を点線にして「裏に隠れている」ことを示す。
const SelectionOverlay = styled.div<{
  $block: SpanBoxBlock
  $occluded: boolean
  $cell: number
}>`
  position: absolute;
  left: ${({ $block, $cell }) => $block.x * $cell}px;
  top: ${({ $block, $cell }) => $block.y * $cell}px;
  width: ${({ $block, $cell }) => $block.width * $cell}px;
  height: ${({ $block, $cell }) => $block.height * $cell}px;
  z-index: 100;
  box-sizing: border-box;
  border: ${({ $occluded }) =>
    $occluded ? '2px dashed #202631' : '3px solid #202631'};
  /* 枠自体はクリックを透過し、本体の選択・ドラッグを邪魔しない */
  pointer-events: none;
`

const BlockLabel = styled.div`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.94rem;
  font-weight: 800;
`

const BlockMeta = styled.div`
  color: rgba(16, 20, 27, 0.6);
  font-size: 0.6rem;
  font-weight: 700;
`

const cornerSize = 12

const ResizeHandle = styled.button<{ $edge: ResizeEdge }>`
  position: absolute;
  border: 0;
  background: #202631;
  box-shadow: 0 0 0 2px #ffffff;
  padding: 0;
  /* オーバーレイは透過なので、ハンドルだけ操作を受け取る */
  pointer-events: auto;

  ${({ $edge }) => {
    if ($edge === 'top') {
      return `
        top: -7px;
        left: calc(50% - 18px);
        width: 36px;
        height: 8px;
        cursor: ns-resize;
      `
    }
    if ($edge === 'right') {
      return `
        top: calc(50% - 18px);
        right: -7px;
        width: 8px;
        height: 36px;
        cursor: ew-resize;
      `
    }
    if ($edge === 'bottom') {
      return `
        bottom: -7px;
        left: calc(50% - 18px);
        width: 36px;
        height: 8px;
        cursor: ns-resize;
      `
    }
    if ($edge === 'left') {
      return `
        top: calc(50% - 18px);
        left: -7px;
        width: 8px;
        height: 36px;
        cursor: ew-resize;
      `
    }
    if ($edge === 'top-left') {
      return `
        top: -8px;
        left: -8px;
        width: ${cornerSize}px;
        height: ${cornerSize}px;
        cursor: nwse-resize;
        border-radius: 2px;
      `
    }
    if ($edge === 'top-right') {
      return `
        top: -8px;
        right: -8px;
        width: ${cornerSize}px;
        height: ${cornerSize}px;
        cursor: nesw-resize;
        border-radius: 2px;
      `
    }
    if ($edge === 'bottom-left') {
      return `
        bottom: -8px;
        left: -8px;
        width: ${cornerSize}px;
        height: ${cornerSize}px;
        cursor: nesw-resize;
        border-radius: 2px;
      `
    }
    return `
      bottom: -8px;
      right: -8px;
      width: ${cornerSize}px;
      height: ${cornerSize}px;
      cursor: nwse-resize;
      border-radius: 2px;
    `
  }}
`

const Inspector = styled.aside`
  align-self: start;
  display: grid;
  gap: 12px;
  background: #ffffff;
  border: 1px solid #d7dde8;
  border-radius: 8px;
  padding: 14px;
  box-shadow: 0 10px 28px rgba(31, 39, 54, 0.08);
`

const PanelTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  color: #202631;
`

const Hint = styled.p`
  margin: 0;
  color: #9aa3b2;
  font-size: 0.78rem;
`

const FieldLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #566174;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
`

const LabelInput = styled.input`
  width: 100%;
  height: 38px;
  box-sizing: border-box;
  border: 1px solid #c7d0dd;
  border-radius: 6px;
  padding: 0 10px;
  color: #202631;
  font-size: 0.9rem;
`

const Swatches = styled.div`
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 4px;
`

const SwatchButton = styled.button<{ $color: string; $selected: boolean }>`
  aspect-ratio: 1;
  border: ${({ $selected }) => ($selected ? '2px solid #202631' : '1px solid #c8d0dd')};
  border-radius: 4px;
  background: ${({ $color }) => $color};
  cursor: pointer;
`

const CollapseHeader = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: none;
  color: #566174;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  cursor: pointer;

  svg:last-child {
    margin-left: auto;
    color: #9aa3b2;
  }
`

const CustomColorRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`

const ColorInput = styled.input`
  width: 36px;
  height: 36px;
  border: 1px solid #c7d0dd;
  border-radius: 6px;
  padding: 2px;
  cursor: pointer;
  flex-shrink: 0;
`

const HexInput = styled.input`
  flex: 1;
  height: 36px;
  box-sizing: border-box;
  border: 1px solid #c7d0dd;
  border-radius: 6px;
  padding: 0 10px;
  color: #202631;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 0.86rem;
`

const SelectInput = styled.select`
  width: 100%;
  height: 38px;
  border: 1px solid #c7d0dd;
  border-radius: 6px;
  background: #ffffff;
  color: #202631;
  padding: 0 10px;
  font-size: 0.9rem;
`

const CopyButton = styled.button`
  justify-self: end;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid #c7d0dd;
  border-radius: 6px;
  background: #ffffff;
  color: #202631;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: #f0f4fa;
  }
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
`

const StatBox = styled.div`
  display: grid;
  place-items: center;
  gap: 2px;
  min-height: 56px;
  border: 1px solid #d7dde8;
  border-radius: 6px;
  background: #f6f8fb;

  span {
    color: #667286;
    font-size: 0.68rem;
    font-weight: 800;
  }

  strong {
    color: #202631;
    font-size: 1.1rem;
  }
`

// サイドパネル一杯まで伸ばし、あふれた分だけスクロール (高さ固定にしない)
const LayerList = styled.div`
  display: grid;
  align-content: start;
  gap: 4px;
  flex: 1;
  min-height: 0;
  overflow: auto;
`

const LayerRow = styled.div<{ $selected: boolean; $dragging: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border: 1px solid ${({ $selected }) => ($selected ? '#202631' : '#e2e7f0')};
  border-radius: 6px;
  background: ${({ $selected }) => ($selected ? '#eef2fb' : '#ffffff')};
  opacity: ${({ $dragging }) => ($dragging ? 0.4 : 1)};
`

const DragHandle = styled.span`
  flex-shrink: 0;
  color: #b6bece;
  font-size: 0.9rem;
  line-height: 1;
  cursor: grab;
  user-select: none;

  &:active {
    cursor: grabbing;
  }
`

const LayerColorDot = styled.span<{ $color: string }>`
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 3px;
  background: ${({ $color }) => $color};
`

// Blocks パネルの名前編集用インライン入力
const NameInput = styled.input`
  flex: 1;
  min-width: 0;
  height: 26px;
  box-sizing: border-box;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: 5px;
  background: none;
  color: #202631;
  font-size: 0.82rem;

  &:hover {
    border-color: #e2e7f0;
  }
  &:focus {
    border-color: #256ee8;
    background: #ffffff;
    outline: none;
  }
`

const LayerTag = styled.span`
  flex-shrink: 0;
  padding: 0 4px;
  border: 1px dashed #b6bece;
  border-radius: 4px;
  color: #8a93a6;
  font-size: 0.62rem;
`

const MiniButton = styled.button<{ $active?: boolean }>`
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border: 1px solid ${({ $active }) => ($active ? '#256ee8' : '#c7d0dd')};
  border-radius: 5px;
  background: ${({ $active }) => ($active ? '#eef2fb' : '#ffffff')};
  color: ${({ $active }) => ($active ? '#256ee8' : '#202631')};
  cursor: pointer;

  &:hover {
    background: #f0f4fa;
  }

  &:disabled {
    color: #c2c9d6;
    cursor: not-allowed;
  }
`

const RecolorBar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 2px;
  padding-top: 8px;
  border-top: 1px solid #eceff4;

  > span {
    color: #9aa3b2;
    font-size: 0.66rem;
    font-weight: 700;
  }
`

const RecolorButton = styled.button<{ $stops: string[] }>`
  width: 34px;
  height: 20px;
  flex-shrink: 0;
  border: 1px solid #c7d0dd;
  border-radius: 4px;
  cursor: pointer;
  background: ${({ $stops }) => `linear-gradient(90deg, ${$stops.join(', ')})`};

  &:hover {
    outline: 2px solid #256ee8;
    outline-offset: 1px;
  }
`

export default SpanBox
