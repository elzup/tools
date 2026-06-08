import React, { useMemo, useRef, useState } from 'react'
import {
  FaArrowsAlt,
  FaCopy,
  FaExpandArrowsAlt,
  FaFont,
  FaPalette,
  FaPlus,
  FaTrash,
} from 'react-icons/fa'
import styled from 'styled-components'

type SlilBlock = {
  id: string
  x: number
  y: number
  width: number
  height: number
  color: string
  label: string
}

type DragAction =
  | { kind: 'move'; id: string; origin: GridPoint; block: SlilBlock }
  | { kind: 'resize'; id: string; edge: ResizeEdge; origin: GridPoint; block: SlilBlock }

type GridPoint = {
  x: number
  y: number
}

type ResizeEdge = 'top' | 'right' | 'bottom' | 'left'

const cellSize = 32
const gridColumns = 28
const gridRows = 18
const minBlockSize = 1

const colorOptions = [
  { name: 'mint', value: '#4ecdc4' },
  { name: 'sun', value: '#ffbe3d' },
  { name: 'coral', value: '#ff6b6b' },
  { name: 'sky', value: '#5b8def' },
  { name: 'violet', value: '#8f63d8' },
  { name: 'ink', value: '#303846' },
]

const initialBlocks: SlilBlock[] = [
  { id: 'block-1', x: 2, y: 2, width: 5, height: 3, color: '#4ecdc4', label: 'agenda' },
  { id: 'block-2', x: 10, y: 4, width: 7, height: 2, color: '#ffbe3d', label: 'issue' },
  { id: 'block-3', x: 5, y: 10, width: 4, height: 5, color: '#5b8def', label: 'owner' },
]

const SlilPrototype = () => {
  const boardRef = useRef<HTMLDivElement>(null)
  const nextIdRef = useRef(4)
  const [blocks, setBlocks] = useState<SlilBlock[]>(initialBlocks)
  const [selectedId, setSelectedId] = useState(initialBlocks[0].id)
  const [dragAction, setDragAction] = useState<DragAction | null>(null)

  const selectedBlock = blocks.find((block) => block.id === selectedId) ?? blocks[0]
  const occupiedCells = useMemo(() => getOccupiedCells(blocks), [blocks])

  const updateSelectedBlock = (updates: Partial<SlilBlock>) => {
    if (!selectedBlock) return
    setBlocks((currentBlocks) =>
      currentBlocks.map((block) =>
        block.id === selectedBlock.id ? { ...block, ...updates } : block,
      ),
    )
  }

  const addBlock = () => {
    const block: SlilBlock = {
      id: `block-${nextIdRef.current}`,
      x: 1 + ((nextIdRef.current * 3) % 18),
      y: 1 + ((nextIdRef.current * 2) % 12),
      width: 4,
      height: 3,
      color: colorOptions[nextIdRef.current % colorOptions.length].value,
      label: `note ${nextIdRef.current}`,
    }
    nextIdRef.current += 1
    setBlocks((currentBlocks) => [...currentBlocks, block])
    setSelectedId(block.id)
  }

  const duplicateBlock = () => {
    if (!selectedBlock) return
    const block: SlilBlock = {
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
    const remainingBlocks = blocks.filter((block) => block.id !== selectedBlock.id)
    setBlocks(remainingBlocks)
    setSelectedId(remainingBlocks[0].id)
  }

  const startMove = (event: React.PointerEvent, block: SlilBlock) => {
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
    block: SlilBlock,
    edge: ResizeEdge,
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
        ? moveBlock(dragAction.block, delta)
        : resizeBlock(dragAction.block, delta, dragAction.edge)

    setBlocks((currentBlocks) =>
      currentBlocks.map((block) => (block.id === dragAction.id ? nextBlock : block)),
    )
  }

  return (
    <Shell>
      <TopBar>
        <Brand>
          <TitleText>slil</TitleText>
          <SubtitleText>slide + rail block board</SubtitleText>
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
            <ColumnRail>
              {Array.from({ length: gridColumns }, (_, index) => (
                <RailTick key={index}>{index + 1}</RailTick>
              ))}
            </ColumnRail>
            <RowRail>
              {Array.from({ length: gridRows }, (_, index) => (
                <RailTick key={index}>{index + 1}</RailTick>
              ))}
            </RowRail>
            <GridPaper>
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
                      (['top', 'right', 'bottom', 'left'] as ResizeEdge[]).map((edge) => (
                        <ResizeHandle
                          key={edge}
                          $edge={edge}
                          onPointerDown={(event) => startResize(event, block, edge)}
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
                onChange={(event) => updateSelectedBlock({ label: event.target.value })}
              />

              <FieldLabel>
                <FaPalette />
                Color
              </FieldLabel>
              <Swatches>
                {colorOptions.map((colorOption) => (
                  <SwatchButton
                    key={colorOption.value}
                    $color={colorOption.value}
                    $selected={selectedBlock.color === colorOption.value}
                    onClick={() => updateSelectedBlock({ color: colorOption.value })}
                    aria-label={colorOption.name}
                  />
                ))}
              </Swatches>

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
                <option value={`${selectedBlock.width}x${selectedBlock.height}`}>
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
            </>
          )}
        </Inspector>
      </Workspace>
    </Shell>
  )
}

const getOccupiedCells = (blocks: SlilBlock[]) =>
  blocks.flatMap((block) =>
    Array.from({ length: block.width * block.height }, (_, index) => {
      const x = block.x + (index % block.width)
      const y = block.y + Math.floor(index / block.width)
      return `${x}-${y}`
    }),
  )

const getGridPoint = (event: React.PointerEvent): GridPoint => ({
  x: Math.round(event.clientX / cellSize),
  y: Math.round(event.clientY / cellSize),
})

const moveBlock = (block: SlilBlock, delta: GridPoint): SlilBlock => ({
  ...block,
  x: clamp(block.x + delta.x, 0, gridColumns - block.width),
  y: clamp(block.y + delta.y, 0, gridRows - block.height),
})

const resizeBlock = (
  block: SlilBlock,
  delta: GridPoint,
  edge: ResizeEdge,
): SlilBlock => {
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
    const nextX = clamp(block.x + delta.x, 0, block.x + block.width - minBlockSize)
    return {
      ...block,
      x: nextX,
      width: block.width + block.x - nextX,
    }
  }

  const nextY = clamp(block.y + delta.y, 0, block.y + block.height - minBlockSize)
  return {
    ...block,
    y: nextY,
    height: block.height + block.y - nextY,
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

const ColumnRail = styled.div`
  position: absolute;
  top: 0;
  left: 34px;
  display: grid;
  grid-template-columns: repeat(${gridColumns}, ${cellSize}px);
  height: 28px;
  background: #eef2f8;
`

const RowRail = styled.div`
  position: absolute;
  top: 28px;
  left: 0;
  display: grid;
  grid-template-rows: repeat(${gridRows}, ${cellSize}px);
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

const GridPaper = styled.div`
  position: relative;
  width: ${gridColumns * cellSize}px;
  height: ${gridRows * cellSize}px;
  background-color: #ffffff;
  background-image:
    linear-gradient(#dce2ec 1px, transparent 1px),
    linear-gradient(90deg, #dce2ec 1px, transparent 1px);
  background-size: ${cellSize}px ${cellSize}px;
`

const GhostCell = styled.div`
  display: none;
`

const BlockItem = styled.div<{ $block: SlilBlock; $selected: boolean }>`
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
    $selected ? '0 9px 20px rgba(32, 38, 49, 0.24)' : '0 5px 12px rgba(32, 38, 49, 0.13)'};
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
    return `
      top: calc(50% - 18px);
      left: -7px;
      width: 8px;
      height: 36px;
      cursor: ew-resize;
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

export default SlilPrototype
