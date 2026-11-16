import {
  type Carpet,
  PI_DIGITS,
  type Pos,
  buildCarpet,
  formatTime,
  gridSizeForGoal,
  isSamePos,
  neighborPositions,
} from '../../components/PiCarpet/pi'

// 盤面のスタート地点 (path[0]) から上下左右の未踏マスを辿って
// 「円周率の並びになる一筆書きルート」の総数を数える。
const countPiRoutes = ({ size, rows, path }: Carpet) => {
  const goal = path.length - 1
  const start = path[0]
  if (rows[start.row][start.col] !== PI_DIGITS[0]) return 0

  const dfs = (visited: readonly Pos[]): number => {
    const step = visited.length - 1
    if (step === goal) return 1

    const current = visited[step]
    const nextDigit = PI_DIGITS[step + 1]
    const nextCandidates = neighborPositions(current, size).filter(
      (nb) =>
        !visited.some((p) => isSamePos(p, nb)) &&
        rows[nb.row][nb.col] === nextDigit
    )

    return nextCandidates.reduce(
      (sum, next) => sum + dfs([...visited, next]),
      0
    )
  }

  return dfs([start])
}

// Machin の公式を整数演算で回して円周率を求める (ハードコードした桁の検算用)
const machinPi = (length: number) => {
  const scale = 10n ** BigInt(length + 20)
  const atanInv = (x: bigint) => {
    let term = scale / x
    let sum = 0n
    let k = 0n

    while (term !== 0n) {
      const part = term / (2n * k + 1n)
      sum += k % 2n === 0n ? part : -part
      term = term / (x * x)
      k++
    }
    return sum
  }

  return (16n * atanInv(5n) - 4n * atanInv(239n)).toString().slice(0, length)
}

describe('PiCarpet の 2D 盤面', () => {
  const goals = [10, 20, 50, 100]

  test.each(
    goals
  )('goal=%i で各ステップの未踏隣接候補のうち正解数字が常に 1 マスだけ & ルート総数が 1', (goal) => {
    for (let trial = 0; trial < 15; trial++) {
      const carpet = buildCarpet(goal)
      expect(countPiRoutes(carpet)).toBe(1)

      carpet.path.slice(0, goal).forEach((current, step) => {
        const visited = carpet.path.slice(0, step + 1)
        const matchingNeighbors = neighborPositions(
          current,
          carpet.size
        ).filter(
          (nb) =>
            !visited.some((p) => isSamePos(p, nb)) &&
            carpet.rows[nb.row][nb.col] === PI_DIGITS[step + 1]
        )
        expect(matchingNeighbors).toEqual([carpet.path[step + 1]])
      })
    }
  })

  test.each(
    goals
  )('goal=%i の経路が一筆書きで上下左右に隣接し円周率と一致する', (goal) => {
    const { size, rows, path } = buildCarpet(goal)
    const expectedSize = gridSizeForGoal(goal)

    expect(size).toBe(expectedSize)
    expect(rows).toHaveLength(size)
    rows.forEach((row) => {
      expect(row).toHaveLength(size)
    })
    expect(path).toHaveLength(goal + 1)
    expect(path[0]).toEqual({
      row: Math.floor(size / 2),
      col: Math.floor(size / 2),
    })

    const uniqueKeys = new Set(path.map((p) => `${p.row},${p.col}`))
    expect(uniqueKeys.size).toBe(goal + 1)

    path.forEach((pos, step) => {
      expect(pos.row).toBeGreaterThanOrEqual(0)
      expect(pos.row).toBeLessThan(size)
      expect(pos.col).toBeGreaterThanOrEqual(0)
      expect(pos.col).toBeLessThan(size)
      expect(rows[pos.row][pos.col]).toBe(PI_DIGITS[step])

      if (step > 0) {
        const prev = path[step - 1]
        const manhattan =
          Math.abs(pos.row - prev.row) + Math.abs(pos.col - prev.col)
        expect(manhattan).toBe(1)
      }
    })
  })
})

describe('PI_DIGITS', () => {
  test('Machin の公式で求めた桁と一致する', () => {
    expect(PI_DIGITS).toBe(machinPi(PI_DIGITS.length))
  })
})

describe('formatTime', () => {
  test.each([
    [0, '00.00'],
    [1000, '01.00'],
    [9876, '09.88'],
    [63210, '1:03.21'],
  ])('%i ms -> %s', (ms, expected) => {
    expect(formatTime(ms)).toBe(expected)
  })
})

describe('countPiRoutes 自体の妥当性', () => {
  test('最終ステップの別候補セルに同じ数字を置くとルートが増えることを検出できる', () => {
    const goal = 10
    const findForkable = () => {
      for (let i = 0; i < 20; i++) {
        const carpet = buildCarpet(goal)
        const lastPrev = carpet.path[goal - 1]
        const lastTarget = carpet.path[goal]
        const visitedBeforeLast = carpet.path.slice(0, goal)
        const altNeighbor = neighborPositions(lastPrev, carpet.size).find(
          (nb) =>
            !visitedBeforeLast.some((p) => isSamePos(p, nb)) &&
            !isSamePos(nb, lastTarget)
        )
        if (altNeighbor) return { carpet, altNeighbor }
      }
      throw new Error('分岐可能な盤面が見つからない')
    }

    const { carpet, altNeighbor } = findForkable()
    const forkedRows = carpet.rows.map((row, r) =>
      row.map((digit, c) =>
        r === altNeighbor.row && c === altNeighbor.col ? PI_DIGITS[goal] : digit
      )
    )

    expect(countPiRoutes({ ...carpet, rows: forkedRows })).toBeGreaterThan(1)
  })
})
