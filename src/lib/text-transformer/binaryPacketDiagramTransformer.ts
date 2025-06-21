import { BinaryPacketData } from '../../types/binaryPacketData'
import { Transformer, TransformResult } from './transformer'

/**
 * バイナリパケットを図にする変換器
 */
export const parseInput = (
  input: string
): { name: string; offset: number; type: string; length: number }[] => {
  const entries = input.split(' ')

  return entries.map((entry) => {
    const [name, offsetStr, type, lengthStr] = entry.split(':')
    const offset = parseInt(offsetStr)
    const length = parseInt(lengthStr)

    return { name, offset, type, length }
  })
}

export const generateDiagram = (
  data: { name: string; offset: number; type: string; length: number }[]
): string => {
  const width = (length: number) => length / 2 // 1byte = 2char
  const pad = (str: string, len: number) => str.padEnd(len)
  const maxBytesPerLine = 12 // 1行あたりの最大バイト数

  // データを最大バイト数ごとに分割
  const splitData: ExtendedData[][] = []

  // 拡張データ型の定義
  type ExtendedData = {
    name: string
    offset: number
    type: string
    length: number
    startPos: number
    endPos: number
    isPartial?: boolean
    originalIndex?: number
  }

  // データに開始位置と終了位置を追加
  const dataWithPos = data.map((item, index) => {
    const startPos = item.offset
    const endPos = item.offset + item.length / 8 // バイト単位に変換

    return { ...item, startPos, endPos, originalIndex: index } as ExtendedData
  })

  // 最大バイト数ごとに分割
  let currentLine: ExtendedData[] = []
  let currentLineStart = 0
  let currentLineEnd = maxBytesPerLine

  while (dataWithPos.length > 0 || currentLine.length > 0) {
    // 現在の行に含まれるデータを抽出
    for (let i = 0; i < dataWithPos.length; i++) {
      const item = dataWithPos[i]

      // アイテムが現在の行に完全に含まれる場合
      if (item.startPos >= currentLineStart && item.endPos <= currentLineEnd) {
        currentLine.push(item)
        dataWithPos.splice(i, 1)
        i--
        continue
      }

      // アイテムが現在の行にまたがる場合
      if (item.startPos < currentLineEnd && item.endPos > currentLineEnd) {
        // 前半部分
        const firstPartLength = (currentLineEnd - item.startPos) * 8 // ビット単位に変換

        currentLine.push({
          ...item,
          length: firstPartLength,
          endPos: currentLineEnd,
          isPartial: true,
        })

        // 後半部分（次の行用に残す）
        dataWithPos[i] = {
          ...item,
          offset: currentLineEnd,
          startPos: currentLineEnd,
          length: item.length - firstPartLength,
          isPartial: true,
        }
      }
    }

    // 現在の行をソート（オフセット順）
    currentLine.sort((a, b) => a.startPos - b.startPos)

    // 現在の行を追加
    if (currentLine.length > 0) {
      splitData.push([...currentLine])
    }

    // 次の行の準備
    currentLine = []
    currentLineStart = currentLineEnd
    currentLineEnd += maxBytesPerLine
  }

  // 各行の図を生成
  const diagrams = splitData.map((lineData, lineIndex) => {
    // オフセット行
    const offsetStart = lineData[0]?.startPos || 0

    // 通常の処理
    const offsetEnd = Math.min(
      lineData[lineData.length - 1]?.endPos || offsetStart + maxBytesPerLine,
      offsetStart + maxBytesPerLine
    )

    let line1 = ''

    // オフセット行の生成（最後のオフセットも含める）
    for (let i = offsetStart; i <= offsetEnd; i++) {
      line1 += pad(i.toString(), 5)
    }

    // 区切り線と名前行
    let line2 = ''
    let line3 = ''

    // すべての項目を表示
    const displayItems = lineData

    displayItems.forEach((item, index) => {
      // 区切り線の幅を固定（19文字）
      const dashWidth = 19

      // 区切り線
      line2 += `+${'-'.repeat(dashWidth)}`

      // 名前行
      const displayName = item.isPartial
        ? item.startPos === offsetStart
          ? item.name
          : ''
        : item.name

      // 名前の幅を計算（最大17文字）
      const nameWidth = 17
      let suffix = ''

      // 最後の項目が部分的な場合、:を追加
      if (item.isPartial && index === displayItems.length - 1) {
        suffix = ':'
      }

      line3 += `|${pad(displayName, nameWidth)} `

      // 最後の項目の場合、閉じる
      if (index === displayItems.length - 1) {
        line2 += '+'
        line3 += suffix || '|'
      }
    })

    return `${line1}\n${line2}\n${line3}\n${line2}`
  })

  // 説明部分
  const descriptions = data
    .map((item) => `${item.name}: ${item.name} ${item.length / 8}byte`)
    .join('\n')

  return `${diagrams.join('\n\n')}\n${descriptions}`
}

export const generateTextDiagramTransformer: Transformer = (
  input: string
): TransformResult => {
  try {
    const parsedData = parseInput(input)
    const diagram = generateDiagram(parsedData)

    return { success: true, diagram }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e)

    return { success: false, error: errorMessage }
  }
}
