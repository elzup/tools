import type React from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
  FaArrowsAlt,
  FaClipboard,
  FaCopy,
  FaExpandArrowsAlt,
  FaFont,
  FaPalette,
  FaPlus,
  FaTrash,
} from 'react-icons/fa'
import styled from 'styled-components'

type SpanBoxBlock = {
  id: string
  x: number
  y: number
  width: number
  height: number
  color: string
  label: string
}

type DragAction =
  | { kind: 'move'; id: string; origin: GridPoint; block: SpanBoxBlock }
  | {
      kind: 'resize'
      id: string
      edge: ResizeEdge
      origin: GridPoint
      block: SpanBoxBlock
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

const cellSize = 32
const minBlockSize = 1
const defaultColumns = 56
const defaultRows = 36
const minColumns = 8
const maxColumns = 96
const minRows = 6
const maxRows = 64

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
  const nextIdRef = useRef(4)
  const [blocks, setBlocks] = useState<SpanBoxBlock[]>(initialBlocks)
  const [selectedId, setSelectedId] = useState(initialBlocks[0].id)
  const [shareDraft, setShareDraft] = useState<string | null>(null)
  const [dragAction, setDragAction] = useState<DragAction | null>(null)
  const [gridColumns, setGridColumns] = useState(defaultColumns)
  const [gridRows, setGridRows] = useState(defaultRows)

  // グリッド縮小時にはみ出すブロックを内側へ収める
  const resizeGrid = (cols: number, rows: number) => {
    setGridColumns(cols)
    setGridRows(rows)
    setBlocks((current) =>
      current.map((block) => ({
        ...block,
        width: clamp(block.width, minBlockSize, cols),
        height: clamp(block.height, minBlockSize, rows),
        x: clamp(block.x, 0, cols - Math.min(block.width, cols)),
        y: clamp(block.y, 0, rows - Math.min(block.height, rows)),
      }))
    )
  }

  const selectedBlock =
    blocks.find((block) => block.id === selectedId) ?? blocks[0]

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
    if (!parsed.some((b) => b.id === selectedId)) setSelectedId(parsed[0].id)
  }
  const occupiedCells = useMemo(() => getOccupiedCells(blocks), [blocks])

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
    setSelectedId(block.id)
  }

  const duplicateBlock = () => {
    if (!selectedBlock) return
    const block: SpanBoxBlock = {
      ...selectedBlock,
      id: `block-${nextIdRef.current}`,
      x: clamp(selectedBlock.x + 1, 0, gridColumns - selectedBlock.width),
      y: clamp(selectedBlock.y + 1, 0, gridRows - selectedBlock.height),
      label: `${selectedBlock.label} copy`,
    }
    nextIdRef.current += 1
    setBlocks((currentBlocks) => [...currentBlocks, block])
    setSelectedId(block.id)
  }

  const deleteSelectedBlock = () => {
    if (!selectedBlock || blocks.length === 1) return
    const remainingBlocks = blocks.filter(
      (block) => block.id !== selectedBlock.id
    )
    setBlocks(remainingBlocks)
    setSelectedId(remainingBlocks[0].id)
  }

  const startMove = (event: React.PointerEvent, block: SpanBoxBlock) => {
    if (isControlTarget(event.target)) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setSelectedId(block.id)
    setDragAction({
      kind: 'move',
      id: block.id,
      origin: getGridPoint(event),
      block,
    })
  }

  const startResize = (
    event: React.PointerEvent,
    block: SpanBoxBlock,
    edge: ResizeEdge
  ) => {
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    setSelectedId(block.id)
    setDragAction({
      kind: 'resize',
      id: block.id,
      edge,
      origin: getGridPoint(event),
      block,
    })
  }

  const dragBlock = (event: React.PointerEvent) => {
    if (!dragAction) return
    const currentPoint = getGridPoint(event)
    const delta = {
      x: currentPoint.x - dragAction.origin.x,
      y: currentPoint.y - dragAction.origin.y,
    }
    const nextBlock =
      dragAction.kind === 'move'
        ? moveBlock(dragAction.block, delta, gridColumns, gridRows)
        : resizeBlock(
            dragAction.block,
            delta,
            dragAction.edge,
            gridColumns,
            gridRows
          )

    setBlocks((currentBlocks) =>
      currentBlocks.map((block) =>
        block.id === dragAction.id ? nextBlock : block
      )
    )
  }

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
          <ToolButton
            onClick={duplicateBlock}
            disabled={!selectedBlock}
            title="Duplicate selected block"
          >
            <FaCopy />
          </ToolButton>
          <ToolButton
            onClick={deleteSelectedBlock}
            disabled={blocks.length === 1}
            title="Delete selected block"
          >
            <FaTrash />
          </ToolButton>

          <GridSizeControls>
            <GridField>
              <span>列</span>
              <GridNumberInput
                type="number"
                min={minColumns}
                max={maxColumns}
                value={gridColumns}
                onChange={(event) =>
                  resizeGrid(
                    clamp(
                      Number(event.target.value) || minColumns,
                      minColumns,
                      maxColumns
                    ),
                    gridRows
                  )
                }
              />
            </GridField>
            <GridField>
              <span>行</span>
              <GridNumberInput
                type="number"
                min={minRows}
                max={maxRows}
                value={gridRows}
                onChange={(event) =>
                  resizeGrid(
                    gridColumns,
                    clamp(
                      Number(event.target.value) || minRows,
                      minRows,
                      maxRows
                    )
                  )
                }
              />
            </GridField>
          </GridSizeControls>
        </ToolbarGroup>
      </TopBar>

      <Workspace>
        <BoardPanel>
          <RailHeader>
            <RailCaption>
              <FaArrowsAlt />
              snap grid
            </RailCaption>
            <RailCaption>
              <FaExpandArrowsAlt />
              edge rails resize
            </RailCaption>
          </RailHeader>

          <Board
            ref={boardRef}
            onPointerMove={dragBlock}
            onPointerUp={() => setDragAction(null)}
            onPointerCancel={() => setDragAction(null)}
          >
            <ColumnRail $cols={gridColumns}>
              {Array.from({ length: gridColumns }, (_, index) => (
                <RailTick key={index}>{index + 1}</RailTick>
              ))}
            </ColumnRail>
            <RowRail $rows={gridRows}>
              {Array.from({ length: gridRows }, (_, index) => (
                <RailTick key={index}>{index + 1}</RailTick>
              ))}
            </RowRail>
            <GridPaper $cols={gridColumns} $rows={gridRows}>
              {occupiedCells.map((cell) => (
                <GhostCell key={cell} />
              ))}
              {blocks.map((block) => {
                const isSelected = block.id === selectedId
                return (
                  <BlockItem
                    key={block.id}
                    $block={block}
                    $selected={isSelected}
                    onPointerDown={(event) => startMove(event, block)}
                  >
                    <BlockLabel>{block.label}</BlockLabel>
                    <BlockMeta>
                      {block.width} x {block.height}
                    </BlockMeta>
                    {isSelected &&
                      (
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
                  </BlockItem>
                )
              })}
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

              <FieldLabel>
                <FaPalette />
                Color
              </FieldLabel>
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

              <Separator />
              <FieldLabel>
                <FaClipboard />
                Share (編集可)
              </FieldLabel>
              <ShareText
                value={shareDraft ?? generateShareText(blocks)}
                onFocus={() => setShareDraft(generateShareText(blocks))}
                onBlur={() => setShareDraft(null)}
                onChange={(event) => handleShareChange(event.target.value)}
                spellCheck={false}
              />
              <CopyButton onClick={copyShareText}>
                <FaCopy />
                Copy
              </CopyButton>
            </>
          )}
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

const getGridPoint = (event: React.PointerEvent): GridPoint => ({
  x: Math.round(event.clientX / cellSize),
  y: Math.round(event.clientY / cellSize),
})

const moveBlock = (
  block: SpanBoxBlock,
  delta: GridPoint,
  gridColumns: number,
  gridRows: number
): SpanBoxBlock => ({
  ...block,
  x: clamp(block.x + delta.x, 0, gridColumns - block.width),
  y: clamp(block.y + delta.y, 0, gridRows - block.height),
})

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

const isControlTarget = (target: EventTarget) =>
  target instanceof HTMLElement &&
  ['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(target.tagName)

const Shell = styled.div`
  min-height: calc(100vh - 40px);
  background: #f6f7fb;
  color: #202631;
  padding: 18px;
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

const GridNumberInput = styled.input`
  width: 56px;
  height: 38px;
  box-sizing: border-box;
  border: 1px solid #c7d0dd;
  border-radius: 6px;
  padding: 0 8px;
  color: #202631;
  font-size: 0.9rem;
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

const ToolButton = styled.button`
  display: inline-grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid #c7d0dd;
  border-radius: 6px;
  background: #ffffff;
  color: #202631;
  cursor: pointer;

  &:hover {
    background: #f0f4fa;
  }

  &:disabled {
    color: #a1aaba;
    cursor: not-allowed;
  }
`

const Workspace = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 16px;
  max-width: 1240px;
  margin: 0 auto;

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`

const BoardPanel = styled.section`
  min-width: 0;
  background: #ffffff;
  border: 1px solid #d7dde8;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 28px rgba(31, 39, 54, 0.08);
`

const RailHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 42px;
  padding: 0 14px;
  border-bottom: 1px solid #d7dde8;
  background: #fbfcff;
`

const RailCaption = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #566174;
  font-size: 0.82rem;
  font-weight: 700;
`

const Board = styled.div`
  position: relative;
  overflow: auto;
  padding: 28px 0 0 34px;
  touch-action: none;
`

const ColumnRail = styled.div<{ $cols: number }>`
  position: absolute;
  top: 0;
  left: 34px;
  display: grid;
  grid-template-columns: repeat(${({ $cols }) => $cols}, ${cellSize}px);
  height: 28px;
  background: #eef2f8;
`

const RowRail = styled.div<{ $rows: number }>`
  position: absolute;
  top: 28px;
  left: 0;
  display: grid;
  grid-template-rows: repeat(${({ $rows }) => $rows}, ${cellSize}px);
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

const GridPaper = styled.div<{ $cols: number; $rows: number }>`
  position: relative;
  width: ${({ $cols }) => $cols * cellSize}px;
  height: ${({ $rows }) => $rows * cellSize}px;
  background-color: #ffffff;
  background-image:
    linear-gradient(#dce2ec 1px, transparent 1px),
    linear-gradient(90deg, #dce2ec 1px, transparent 1px);
  background-size: ${cellSize}px ${cellSize}px;
`

const GhostCell = styled.div`
  display: none;
`

const BlockItem = styled.div<{ $block: SpanBoxBlock; $selected: boolean }>`
  position: absolute;
  left: ${({ $block }) => $block.x * cellSize}px;
  top: ${({ $block }) => $block.y * cellSize}px;
  width: ${({ $block }) => $block.width * cellSize}px;
  height: ${({ $block }) => $block.height * cellSize}px;
  display: grid;
  align-content: center;
  gap: 2px;
  padding: 8px 10px;
  border: ${({ $selected }) => ($selected ? '3px solid #202631' : '1px solid rgba(32, 38, 49, 0.22)')};
  background: ${({ $block }) => $block.color};
  box-shadow: ${({ $selected }) =>
    $selected
      ? '0 9px 20px rgba(32, 38, 49, 0.24)'
      : '0 5px 12px rgba(32, 38, 49, 0.13)'};
  color: #10141b;
  cursor: grab;
  user-select: none;
  overflow: visible;

  &:active {
    cursor: grabbing;
  }
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
  color: rgba(16, 20, 27, 0.68);
  font-size: 0.72rem;
  font-weight: 700;
`

const cornerSize = 12

const ResizeHandle = styled.button<{ $edge: ResizeEdge }>`
  position: absolute;
  border: 0;
  background: #202631;
  box-shadow: 0 0 0 2px #ffffff;
  padding: 0;

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
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
`

const SwatchButton = styled.button<{ $color: string; $selected: boolean }>`
  aspect-ratio: 1;
  border: ${({ $selected }) => ($selected ? '3px solid #202631' : '1px solid #c8d0dd')};
  border-radius: 6px;
  background: ${({ $color }) => $color};
  cursor: pointer;
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

const Separator = styled.hr`
  margin: 4px 0;
  border: 0;
  border-top: 1px solid #d7dde8;
`

const ShareText = styled.textarea`
  width: 100%;
  height: 110px;
  box-sizing: border-box;
  border: 1px solid #c7d0dd;
  border-radius: 6px;
  padding: 8px 10px;
  color: #202631;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 0.76rem;
  line-height: 1.5;
  resize: none;
  background: #f6f8fb;
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

export default SpanBox
