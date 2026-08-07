// 1 つの時計は針が 2 本しかないため、1 セルで表現できる方向は最大 2 つ。
// 7 セグの交点 (縦線 + 中央横棒 = 3 方向) だけは 1 方向を捨てて表現する。
export type Dir = 'U' | 'R' | 'D' | 'L'
export type Cell = Dir[]

export const DIGIT_ROWS = 5
export const DIGIT_COLS = 3

const DIR_ANGLE: Record<Dir, number> = { U: 0, R: 90, D: 180, L: 270 }

// 消灯状態の針の向き (7:30 方向に 2 本重ねる)
export const OFF_ANGLE = 225

type SegmentKey = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g'
type CellDir = { row: number; col: number; dir: Dir }

// 7 セグの各セグメントを「どのセルにどの方向の線を足すか」で表現する
const SEGMENT_CELLS: Record<SegmentKey, CellDir[]> = {
  // 上の横棒
  a: [
    { row: 0, col: 0, dir: 'R' },
    { row: 0, col: 1, dir: 'L' },
    { row: 0, col: 1, dir: 'R' },
    { row: 0, col: 2, dir: 'L' },
  ],
  // 右上の縦棒
  b: [
    { row: 0, col: 2, dir: 'D' },
    { row: 1, col: 2, dir: 'U' },
    { row: 1, col: 2, dir: 'D' },
    { row: 2, col: 2, dir: 'U' },
  ],
  // 右下の縦棒
  c: [
    { row: 2, col: 2, dir: 'D' },
    { row: 3, col: 2, dir: 'U' },
    { row: 3, col: 2, dir: 'D' },
    { row: 4, col: 2, dir: 'U' },
  ],
  // 下の横棒
  d: [
    { row: 4, col: 0, dir: 'R' },
    { row: 4, col: 1, dir: 'L' },
    { row: 4, col: 1, dir: 'R' },
    { row: 4, col: 2, dir: 'L' },
  ],
  // 左下の縦棒
  e: [
    { row: 2, col: 0, dir: 'D' },
    { row: 3, col: 0, dir: 'U' },
    { row: 3, col: 0, dir: 'D' },
    { row: 4, col: 0, dir: 'U' },
  ],
  // 左上の縦棒
  f: [
    { row: 0, col: 0, dir: 'D' },
    { row: 1, col: 0, dir: 'U' },
    { row: 1, col: 0, dir: 'D' },
    { row: 2, col: 0, dir: 'U' },
  ],
  // 中央の横棒
  g: [
    { row: 2, col: 0, dir: 'R' },
    { row: 2, col: 1, dir: 'L' },
    { row: 2, col: 1, dir: 'R' },
    { row: 2, col: 2, dir: 'L' },
  ],
}

const DIGIT_SEGMENTS: Record<string, SegmentKey[]> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'g', 'e', 'd'],
  '3': ['a', 'b', 'g', 'c', 'd'],
  '4': ['f', 'g', 'b', 'c'],
  '5': ['a', 'f', 'g', 'c', 'd'],
  '6': ['a', 'f', 'g', 'e', 'd', 'c'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
}

const MAX_DIRS = 2
// 3 方向必要なセル (縦線と中央横棒の交点) で捨てる方向。
// 上向きを捨てて、中央横棒と下側の縦線をつなげる。
const DROP_PRIORITY: Dir[] = ['U', 'D', 'L', 'R']

const limitDirs = (dirs: Dir[]): Cell => {
  if (dirs.length <= MAX_DIRS) return dirs

  const dropped = DROP_PRIORITY.reduce(
    (acc, dir) =>
      acc.length > MAX_DIRS ? acc.filter((it) => it !== dir) : acc,
    dirs
  )

  return dropped.slice(0, MAX_DIRS)
}

const emptyCells = (): Cell[][] =>
  Array.from({ length: DIGIT_ROWS }, () =>
    Array.from({ length: DIGIT_COLS }, (): Cell => [])
  )

export const buildDigitCells = (char: string): Cell[][] => {
  const segments = DIGIT_SEGMENTS[char]

  if (!segments) return emptyCells()

  const cellDirs = segments.flatMap((segment) => SEGMENT_CELLS[segment])

  return emptyCells().map((row, rowIndex) =>
    row.map((_, colIndex) =>
      limitDirs(
        cellDirs
          .filter((it) => it.row === rowIndex && it.col === colIndex)
          .map((it) => it.dir)
      )
    )
  )
}

const blankColumn = (): Cell[] =>
  Array.from({ length: DIGIT_ROWS }, (): Cell => [])

const digitColumns = (char: string): Cell[][] => {
  const cells = buildDigitCells(char)

  return Array.from({ length: DIGIT_COLS }, (_, col) =>
    cells.map((row) => row[col])
  )
}

const GROUP_GAP_COLS = 1
const DIGIT_GAP_COLS = 0

const gapColumns = (count: number): Cell[][] =>
  Array.from({ length: count }, blankColumn)

/** グループ (例: ['12', '34']) を 5 行 x N 列のセル行列に展開する */
export const buildBoard = (groups: string[]): Cell[][] => {
  const columns = groups.flatMap((group, groupIndex) => [
    ...(groupIndex > 0 ? gapColumns(GROUP_GAP_COLS) : []),
    ...group
      .split('')
      .flatMap((char, digitIndex) => [
        ...(digitIndex > 0 ? gapColumns(DIGIT_GAP_COLS) : []),
        ...digitColumns(char),
      ]),
  ])

  return Array.from({ length: DIGIT_ROWS }, (_, row) =>
    columns.map((column) => column[row])
  )
}

/** セルの方向集合を 2 本の針の角度に変換する (1 方向なら 2 本重ねる) */
export const cellAngles = (cell: Cell): [number, number] => {
  if (cell.length === 0) return [OFF_ANGLE, OFF_ANGLE]
  if (cell.length === 1) return [DIR_ANGLE[cell[0]], DIR_ANGLE[cell[0]]]

  return [DIR_ANGLE[cell[0]], DIR_ANGLE[cell[1]]]
}
