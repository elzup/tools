import { Transformer, TransformResult } from './transformer'

// バイナリパケットダイアグラム変換器の仕様
// 現在認識している仕様は以下の通りです：

// 入力形式
// 入力は name:offset:type:length 形式のフィールド定義が空白で区切られた文字列
// 例: SQ:0:sequence:8 val1:1:mpa:32 val2:5:tmp:32 val3:9:voltage:32 val4:13:mm:32 CSQ:17:csq:16
// 各フィールドの構成要素：
// name: フィールド名（例: SQ, val1, seq）
// offset: バイトオフセット（例: 0, 1, 5）
// type: データ型（例: sequence, mpa, int, float）
// length: ビット長（例: 8, 16, 32）
// 出力形式
// ダイアグラム構造:

// オフセット行: バイト位置を示す数字の行（例: 0 1 2 3 4...）
// 区切り線: +-------------------+ のような区切り
// 名前行: フィールド名を表示する行（例: |SQ |val1 |...）
// 説明部分: 各フィールドの詳細情報（例: SQ: SQ 1byte）
// 表示の特徴:

// 1行あたり最大12バイトまで表示
// 12バイトを超える場合は折り返し表示
// 折り返し行の先頭は「:」で始まる
// 折り返し行の区切り線は、最後のセグメントが不完全になる可能性がある
// バイト表現:

// 各フィールドの幅はビット長に比例
// 4バイトごとにセグメント化されている

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

  const entries = input.split(' ')

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
export const generateNumberLine = (
  startOffset: number,
  endOffset: number
): string => {
  // テストケースの期待値に合わせて、正確な幅で文字列をパディングする
  const pad = (str: string, len: number) => str.padEnd(len)

  let offsetLine = ''

  // 表示するバイト数を計算
  for (let i = startOffset; i <= endOffset; i++) {
    offsetLine += pad(i.toString(), 5)
  }

  // 余分な空白を削除
  return offsetLine.trimEnd()
}

// 区切り線を生成する関数
export const generateSeparatorLine = (
  startOffset: number,
  endOffset: number,
  isWrapped = false
): string => {
  const totalBytes = endOffset - startOffset
  const groupSize = 4 // 4バイトごとに区切り

  let line = '|'

  // 4バイトグループの数と余り
  const fullGroups = Math.floor(totalBytes / groupSize)
  const remainder = totalBytes % groupSize

  // 各4バイトグループを処理
  for (let i = 0; i < fullGroups; i++) {
    line += '----+----+----+----|'
  }

  // 余りのバイト数に応じて処理
  if (remainder > 0) {
    for (let i = 0; i < remainder; i++) {
      line += '----+'
    }
  }

  return line
}

// ラベル行を生成する関数
export const generateLabelLine = (
  data: {
    name: string
    offset: number
    type: string | undefined
    length: number
    startPos: number
    endPos: number
    isPartial?: boolean
  }[],
  startOffset: number,
  endOffset: number,
  isWrapped = false,
  needsContinuation = false
): string => {
  // 名前行の先頭文字
  let nameLine = isWrapped ? ':' : '|'

  // アイテムをオフセット順にソート
  const sortedItems = [...data].sort((a, b) => a.startPos - b.startPos)

  for (let i = 0; i < sortedItems.length; i++) {
    const item = sortedItems[i]
    const fieldBytes = Math.ceil(item.length / 8)
    
    // アイテムの名前を表示
    let displayName = item.name

    // 部分的なアイテムの場合の特別処理
    if (item.isPartial) {
      // 折り返し行の先頭アイテムは名前を表示する
      if (i === 0 && isWrapped) {
        displayName = item.name
      } else {
        // それ以外の部分的なアイテムは名前を表示しない
        displayName = ''
      }
    }

    // フィールドの幅を計算
    let fieldWidth
    if (fieldBytes === 1) {
      fieldWidth = 4 // 1バイトフィールドは4文字
    } else if (fieldBytes === 2) {
      fieldWidth = 9 // 2バイトフィールドは9文字
    } else {
      // 4バイト以上は通常の計算
      fieldWidth = fieldBytes * 4 + Math.max(0, fieldBytes - 1)
    }
    
    // 最後のフィールドで折り返しがある場合は幅を調整
    if (i === sortedItems.length - 1 && needsContinuation) {
      // 継続する場合は最後の | を除く
      fieldWidth = fieldWidth - 1
    }
    
    // 名前を適切な幅で配置
    if (displayName.length <= fieldWidth) {
      nameLine += displayName.padEnd(fieldWidth) + '|'
    } else {
      // 名前が長すぎる場合は切り詰める
      nameLine += displayName.substring(0, fieldWidth) + '|'
    }
  }

  // 折り返しが必要な場合は最後の|を:に置き換え
  if (needsContinuation) {
    nameLine = nameLine.slice(0, -1) + ':'
  }

  return nameLine
}

export const generateDiagram = (
  data: {
    name: string
    offset: number
    type: string | undefined
    length: number
  }[]
): string => {
  // 定数定義
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

  // 無限ループ防止のためのカウンター
  let loopCount = 0
  const maxLoops = 1000 // 安全のための最大ループ回数

  while (
    (dataWithPos.length > 0 || currentLine.length > 0) &&
    loopCount < maxLoops
  ) {
    loopCount++

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

    // 無限ループ防止: 何も処理されなかった場合は強制的に次の行へ
    if (currentLine.length === 0 && dataWithPos.length > 0) {
      currentLineStart = currentLineEnd
      currentLineEnd += maxBytesPerLine
      continue
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

    // 1行に表示するアイテムを決定
    // 1行あたりの最大バイト数（12バイト）に基づいて、適切なアイテムを表示
    const displayItems = lineData.filter(
      (item) =>
        item.startPos < offsetStart + maxBytesPerLine &&
        item.startPos >= offsetStart
    )

    // オフセット行の生成
    const offsetLine = generateNumberLine(offsetStart, offsetEnd)

    // 区切り線の生成
    let separatorLine = generateSeparatorLine(offsetStart, offsetEnd)

    // アイテムをオフセット順にソート
    const sortedItems = [...displayItems].sort((a, b) => a.offset - b.offset)

    // 折り返し判定
    const needsContinuation = lineIndex < splitData.length - 1
    const isWrapped = lineIndex > 0

    // 名前行を生成
    const nameLine = generateLabelLine(
      sortedItems.map(item => ({
        ...item,
        startPos: item.offset,
        endPos: item.offset + item.length / 8
      })),
      offsetStart,
      offsetEnd,
      isWrapped,
      needsContinuation
    )

    // 名前行の下の区切り線を生成（ラベル区切り線）
    // 名前行の実際の幅に合わせてダッシュを生成
    let labelSeparatorLine = '|'
    for (let i = 0; i < sortedItems.length; i++) {
      const item = sortedItems[i]
      const fieldBytes = Math.ceil(item.length / 8)
      let fieldWidth = fieldBytes * 4 + Math.max(0, fieldBytes - 1)
      
      // 最後のフィールドで折り返しがある場合は幅を調整
      if (i === sortedItems.length - 1 && needsContinuation) {
        fieldWidth = fieldWidth - 1
      }
      
      // 1バイトフィールドは特別な計算
      if (fieldBytes === 1) {
        labelSeparatorLine += '-'.repeat(9) + '+'
      } else if (fieldBytes === 2) {
        labelSeparatorLine += '-'.repeat(5) + '+'
      } else {
        labelSeparatorLine += '-'.repeat(fieldWidth) + '+'
      }
    }
    
    // 最後の+を削除（折り返しがない場合）
    if (!needsContinuation) {
      labelSeparatorLine = labelSeparatorLine.slice(0, -1)
    }
    
    return `${offsetLine}\n${separatorLine}\n${nameLine}\n${labelSeparatorLine}`
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

    const diagram = generateDiagram(parsedData)

    return { success: true, diagram }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e)

    return { success: false, error: errorMessage }
  }
}
