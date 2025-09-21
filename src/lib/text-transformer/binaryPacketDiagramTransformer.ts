import { Transformer, TransformResult } from './transformer'

// バイナリパケットダイアグラム変換器の仕様（テストケースより）
//
// 入力: "name:offset:type:length" を空白区切りで並べた文字列。
//       length はビット長、offset はバイトオフセットで評価する。
// 出力: 1 行あたり maxBytesPerLine バイト分の図を描画し、末尾にフィールド要約を続ける。
//       既定値は 12 バイト。折り返し発生時は先頭を ":"、継続時は行末を ":" とする。
//       数字行・区切り線・ラベル行を順に出力し、複数行がある場合は 1 行ずつ空行で区切る。
//       ラベルはフィールド幅に合わせて描画し、折り返し区間では名前表示を抑制する場合がある。

/**
 * バイナリパケットを図にする変換器
 */
export const parseInput = (
  input: string
): {
  name: string
  offset: number
  type: string | undefined
  length: number
}[] => {
  if (!input || input.trim() === '') {
    return [{ name: '', offset: NaN, type: undefined, length: NaN }]
  }

  const entries = input.trim().split(/\s+/)

  return entries.map((entry) => {
    const parts = entry.split(':')

    if (parts.length < 4) {
      throw new Error(`無効な入力形式です: ${entry}`)
    }

    const [name, offsetStr, type, lengthStr] = parts
    const offset = parseInt(offsetStr)
    const length = parseInt(lengthStr)

    if (isNaN(offset) || isNaN(length)) {
      throw new Error(`無効な数値形式です: ${entry}`)
    }

    return { name, offset, type, length }
  })
}

// 数字行（オフセット行）を生成する関数
const DEFAULT_MAX_BYTES_PER_LINE = 12
const BYTE_CELL_WIDTH = 5
const LINE_TEMPLATE_1 = '|----+----+----+----'
const LINE_TEMPLATE_2 = '|---------+---------'

export type DiagramOptions = {
  maxBytesPerLine?: number
}

type BinaryField = {
  name: string
  offset: number
  type: string | undefined
  length: number
}

type FieldWithLayout = BinaryField & {
  startByte: number
  endByte: number
}

type FieldSegment = BinaryField & {
  startByte: number
  endByte: number
  continuesFromPrevious: boolean
  continuesToNext: boolean
}

type DiagramLine = {
  offsetStart: number
  offsetEnd: number
  segments: FieldSegment[]
}

type LegacyLabelItem = {
  name: string
  offset: number
  type: string | undefined
  length: number
  startPos: number
  endPos: number
  isPartial?: boolean
}

const sanitizeMaxBytesPerLine = (value?: number): number => {
  const numeric = Math.floor(Number(value))

  return Number.isFinite(numeric) && numeric > 0
    ? numeric
    : DEFAULT_MAX_BYTES_PER_LINE
}

const toFieldWithLayout = (field: BinaryField): FieldWithLayout => {
  const byteLength = field.length / 8

  return {
    ...field,
    startByte: field.offset,
    endByte: field.offset + byteLength,
  }
}

const resolveOptions = (
  options?: number | DiagramOptions
): Required<DiagramOptions> => {
  if (typeof options === 'number') {
    return {
      maxBytesPerLine: sanitizeMaxBytesPerLine(options),
    }
  }

  return { maxBytesPerLine: sanitizeMaxBytesPerLine(options?.maxBytesPerLine) }
}

export const generateNumberLine = (
  startOffset: number,
  endOffset: number
): string => {
  let offsetLine = ''

  for (let offset = startOffset; offset <= endOffset; offset++) {
    offsetLine += offset.toString().padEnd(BYTE_CELL_WIDTH)
  }

  return offsetLine.trimEnd()
}

const generateDividerLine = (byteCount: number, template: string): string =>
  template
    .repeat(Math.ceil(byteCount / 4) + 1)
    .slice(0, byteCount * BYTE_CELL_WIDTH + 1)

export const generateLine1 = (byteCount: number): string =>
  generateDividerLine(byteCount, LINE_TEMPLATE_1)

export const generateLine2 = (byteCount: number): string =>
  generateDividerLine(byteCount, LINE_TEMPLATE_2)

const createLineSegments = (
  fields: FieldWithLayout[],
  maxBytesPerLine: number
): DiagramLine[] => {
  if (fields.length === 0) {
    return []
  }

  const sorted = [...fields].sort((a, b) => a.startByte - b.startByte)
  const firstStart = sorted[0].startByte
  const lastEnd = sorted.reduce((acc, field) => Math.max(acc, field.endByte), 0)

  const lines: DiagramLine[] = []

  for (
    let offsetStart = firstStart;
    offsetStart < lastEnd;
    offsetStart += maxBytesPerLine
  ) {
    const offsetUpperBound = offsetStart + maxBytesPerLine
    const segments = sorted.reduce<FieldSegment[]>((acc, field) => {
      if (field.endByte <= offsetStart || field.startByte >= offsetUpperBound) {
        return acc
      }

      const startByte = Math.max(field.startByte, offsetStart)
      const endByte = Math.min(field.endByte, offsetUpperBound)

      if (endByte <= startByte) {
        return acc
      }

      acc.push({
        ...field,
        startByte,
        endByte,
        continuesFromPrevious: startByte > field.startByte,
        continuesToNext: endByte < field.endByte,
      })

      return acc
    }, [])

    if (segments.length === 0) {
      continue
    }

    const offsetEnd = segments.reduce(
      (acc, segment) => Math.max(acc, segment.endByte),
      offsetStart
    )

    lines.push({ offsetStart, offsetEnd, segments })
  }

  return lines
}

const renderLabelLine = (line: DiagramLine): string => {
  const { segments } = line

  if (segments.length === 0) {
    return '|'
  }

  const isWrapped = segments[0].continuesFromPrevious
  const needsContinuation = segments[segments.length - 1].continuesToNext

  let labelLine = isWrapped ? ':' : '|'

  segments.forEach((segment, index) => {
    const byteSpan = segment.endByte - segment.startByte
    const fieldWidth = Math.max(Math.floor(byteSpan * BYTE_CELL_WIDTH) - 1, 0)
    const maxNameLength = fieldWidth
    const isPartial = segment.continuesFromPrevious || segment.continuesToNext
    const isFirst = index === 0
    const isLast = index === segments.length - 1

    let displayName = segment.name

    if (isPartial) {
      if (isFirst && isWrapped) {
        displayName = segment.name
      } else if (isLast && needsContinuation) {
        displayName = segment.name
      } else {
        displayName = ''
      }
    }

    if (displayName.length > maxNameLength) {
      displayName = displayName.substring(0, maxNameLength)
    }

    labelLine += displayName.padEnd(maxNameLength)
    labelLine += '|'
  })

  if (needsContinuation && labelLine.endsWith('|')) {
    labelLine = labelLine.slice(0, -1) + ':'
  }

  return labelLine
}

export function generateLabelLine(
  lineOrData: DiagramLine | LegacyLabelItem[],
  startOffset?: number,
  endOffset?: number,
  isWrapped = false,
  needsContinuation = false
): string {
  if (!Array.isArray(lineOrData)) {
    return renderLabelLine(lineOrData)
  }

  const offsetStart =
    startOffset ?? (lineOrData.length > 0 ? lineOrData[0].startPos : 0)
  const tentativeOffsetEnd =
    endOffset ??
    lineOrData.reduce((acc, item) => Math.max(acc, item.endPos), offsetStart)
  const lineEnd = endOffset ?? tentativeOffsetEnd

  const segments = lineOrData
    .map<FieldSegment | null>((item, index) => {
      const segmentStart = Math.max(item.startPos, offsetStart)
      const segmentEnd = Math.min(item.endPos, lineEnd)

      if (!(segmentEnd > segmentStart)) {
        return null
      }

      const continuesFromPrevious =
        (isWrapped && index === 0) ||
        (item.isPartial === true && item.startPos < offsetStart)
      const continuesToNext =
        (needsContinuation && index === lineOrData.length - 1) ||
        (item.isPartial === true && item.endPos > lineEnd)

      return {
        ...item,
        startByte: segmentStart,
        endByte: segmentEnd,
        continuesFromPrevious,
        continuesToNext,
      }
    })
    .filter((segment): segment is FieldSegment => segment !== null)

  const offsetEnd = segments.reduce(
    (acc, segment) => Math.max(acc, segment.endByte),
    offsetStart
  )

  return renderLabelLine({
    offsetStart,
    offsetEnd,
    segments,
  })
}

export const generateDiagram = (
  data: BinaryField[],
  options?: number | DiagramOptions
): string => {
  const { maxBytesPerLine } = resolveOptions(options)
  const fields = data
    .map(toFieldWithLayout)
    .filter(
      (field) =>
        Number.isFinite(field.startByte) && Number.isFinite(field.endByte)
    )
  const lines = createLineSegments(fields, maxBytesPerLine)

  const lineBlocks = lines.map((line) => {
    const numberLine = generateNumberLine(line.offsetStart, line.offsetEnd)
    const byteCount = line.offsetEnd - line.offsetStart
    const divider1 = generateLine1(byteCount)
    const labelLine = generateLabelLine(line)
    const divider2 = generateLine2(byteCount)

    return `${numberLine}\n${divider1}\n${labelLine}\n${divider2}`
  })

  const descriptionBlock = data
    .filter((field) => Number.isFinite(field.length))
    .map((field) => `${field.name}: ${field.name} ${field.length / 8}byte`)
    .join('\n')

  const sections = [lineBlocks.join('\n\n'), descriptionBlock].filter(
    (section) => section.trim() !== ''
  )

  return sections.join('\n')
}

export const createTextDiagramTransformer = (
  options?: number | DiagramOptions
): Transformer => {
  const resolved = resolveOptions(options)

  return (input: string): TransformResult => {
    try {
      if (!input) {
        return {
          success: false,
          error:
            '入力が空です。正しい形式で入力してください。例: name:offset:type:length',
        }
      }

      const parsedData = parseInput(input)

      if (parsedData.length === 0) {
        return {
          success: false,
          error:
            '有効なデータが見つかりませんでした。正しい形式で入力してください。例: name:offset:type:length',
        }
      }

      const diagram = generateDiagram(parsedData, resolved)

      return { success: true, diagram }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)

      return { success: false, error: errorMessage }
    }
  }
}

export const generateTextDiagramTransformer: Transformer =
  createTextDiagramTransformer()
