// 円周率の先頭 500 桁 (小数点は含めず、先頭の 3 から連続した数字列)
export const PI_DIGITS =
  '3' +
  '14159265358979323846264338327950288419716939937510' +
  '58209749445923078164062862089986280348253421170679' +
  '82148086513282306647093844609550582231725359408128' +
  '48111745028410270193852110555964462294895493038196' +
  '44288109756659334461284756482337867831652712019091' +
  '45648566923460348610454326648213393607260249141273' +
  '72458700660631558817488152092096282925409171536436' +
  '78925903600113305305488204665213841469519415116094' +
  '33057270365759591953092186117381932611793105118548' +
  '07446237996274956735188575272489122793818301194912'

export const MAX_GOAL = PI_DIGITS.length - 1

const ALL_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
// 袋小路に入った探索を深追いせず即座に別シードでやり直すための上限。
// 800 手で打ち切ると 100 桁盤面でも数ミリ秒以内に収束する
const SEARCH_STEP_BUDGET = 800

export type Pos = {
  row: number
  col: number
}

export type Carpet = {
  size: number
  rows: string[][]
  path: Pos[]
}

export const isSamePos = (a: Pos, b: Pos) => a.row === b.row && a.col === b.col

export const gridSizeForGoal = (goal: number) => {
  if (goal <= 10) return 5
  if (goal <= 20) return 7
  if (goal <= 50) return 10
  return Math.max(13, Math.ceil(Math.sqrt((goal + 1) * 1.6)))
}

export const neighborPositions = ({ row, col }: Pos, size: number): Pos[] =>
  [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ].filter(
    (pos) => pos.row >= 0 && pos.row < size && pos.col >= 0 && pos.col < size
  )

const shuffle = <T>(items: readonly T[]): T[] =>
  items
    .map((item) => ({ item, sortKey: Math.random() }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ item }) => item)

const randomDigitExcept = (excluded: ReadonlySet<string>) => {
  const allowed = ALL_DIGITS.filter((d) => !excluded.has(d))
  return allowed[Math.floor(Math.random() * allowed.length)]
}

// 経路が自分自身の近くをかすめるとき、隣り合う別ステップのセルが「次の一手」と
// 同じ数字を持っていると正解方向が二通りに見えてしまうため、その配置を禁止する
const canPlaceStep = (
  pos: Pos,
  path: readonly Pos[],
  goal: number,
  size: number
) => {
  const step = path.length
  return neighborPositions(pos, size).every((nb) => {
    const visitedStep = path.findIndex((p) => isSamePos(p, nb))
    if (visitedStep === -1 || visitedStep === step - 1) return true
    if (PI_DIGITS[step] === PI_DIGITS[visitedStep + 1]) return false
    if (step < goal && PI_DIGITS[visitedStep] === PI_DIGITS[step + 1])
      return false
    return true
  })
}

type SearchState = {
  result: Pos[] | null
  budget: number
}

const searchPath = (
  path: Pos[],
  goal: number,
  size: number,
  budget: number
): SearchState => {
  if (path.length > goal) return { result: path, budget }
  if (budget <= 0) return { result: null, budget: 0 }

  const prev = path[path.length - 1]
  const candidates = shuffle(
    neighborPositions(prev, size).filter(
      (nb) =>
        !path.some((p) => isSamePos(p, nb)) &&
        canPlaceStep(nb, path, goal, size)
    )
  )

  return candidates.reduce<SearchState>(
    (acc, candidate) => {
      if (acc.result !== null || acc.budget <= 0) return acc
      return searchPath([...path, candidate], goal, size, acc.budget - 1)
    },
    { result: null, budget: budget - 1 }
  )
}

const generatePath = (goal: number, size: number): Pos[] => {
  const center: Pos = {
    row: Math.floor(size / 2),
    col: Math.floor(size / 2),
  }
  while (true) {
    const { result } = searchPath([center], goal, size, SEARCH_STEP_BUDGET)
    if (result !== null) return result
  }
}

/**
 * 2 次元グリッドの中央から一筆書きの経路を先に生成し、経路上に円周率の各桁を配置した上で、
 * 残りのマスには「隣接する経路マスの次の一手」と衝突しない数字を埋める。
 * これにより各ステップで上下左右の未踏マスのうち正解の数字は常に 1 マスだけに定まる。
 */
export const buildCarpet = (
  goal: number,
  size = gridSizeForGoal(goal)
): Carpet => {
  const path = generatePath(goal, size)
  const rows = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => {
      const pos = { row, col }
      const stepIndex = path.findIndex((p) => isSamePos(p, pos))
      if (stepIndex !== -1) return PI_DIGITS[stepIndex]

      // 隣接する経路セルが step 番目なら、そこから見た次の一手 (step + 1 桁目) と
      // 同じ数字を置くと分岐に見えてしまうため除外する (最大 4 個なので必ず 6 個以上残る)
      const forbidden = new Set(
        neighborPositions(pos, size).flatMap((nb) => {
          const nbStep = path.findIndex((p) => isSamePos(p, nb))
          return nbStep !== -1 && nbStep < goal ? [PI_DIGITS[nbStep + 1]] : []
        })
      )
      return randomDigitExcept(forbidden)
    })
  )

  return { size, rows, path }
}

export const formatTime = (ms: number) => {
  const total = Math.max(0, Math.round(ms / 10))
  const minutes = Math.floor(total / 6000)
  const seconds = Math.floor(total / 100) % 60
  const centis = total % 100
  const body = `${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`
  return minutes > 0 ? `${minutes}:${body}` : body
}
