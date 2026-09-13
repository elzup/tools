import {
  type Carpet,
  PI_DIGITS,
  buildCarpet,
  formatTime,
  neighborCols,
} from '../../components/PiCarpet/pi'

// 盤面をスタート行から辿って「円周率の並びになるルート」の総数を数える。
// 正解ルートが一つだけであることは、この数が 1 であることと同値
const countPiRoutes = ({ rows }: Carpet) => {
  const cols = rows[0].length
  const routes: number[] = rows[0].map((digit) =>
    digit === PI_DIGITS[0] ? 1 : 0
  )

  return rows
    .slice(1)
    .reduce((prev, row, index) => {
      const digit = PI_DIGITS[index + 1]
      const next = Array.from({ length: cols }, () => 0)

      prev.forEach((count, col) => {
        if (count === 0) return
        neighborCols(col, cols).forEach((to) => {
          if (row[to] === digit) next[to] += count
        })
      })
      return next
    }, routes)
    .reduce((sum, count) => sum + count, 0)
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

describe('PiCarpet の盤面', () => {
  const cases = [10, 20, 50, 100].flatMap((goal) =>
    [5, 7, 9].map((cols) => ({ goal, cols }))
  )

  test.each(cases)('goal=$goal cols=$cols で正解ルートが一つだけ', ({
    goal,
    cols,
  }) => {
    for (let trial = 0; trial < 20; trial++) {
      expect(countPiRoutes(buildCarpet(goal, cols))).toBe(1)
    }
  })

  test.each(cases)('goal=$goal cols=$cols の正解セルが円周率と一致', ({
    goal,
    cols,
  }) => {
    const { rows, path } = buildCarpet(goal, cols)

    expect(rows).toHaveLength(goal + 1)
    path.forEach((col, step) => {
      expect(rows[step]).toHaveLength(cols)
      expect(rows[step][col]).toBe(PI_DIGITS[step])
      expect(col).toBeGreaterThanOrEqual(0)
      expect(col).toBeLessThan(cols)
      // 一手で動けるのは隣の列まで。飛び地があるとルートが繋がらない
      if (step > 0)
        expect(Math.abs(col - path[step - 1])).toBeLessThanOrEqual(1)
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
  test('候補セルに同じ数字を足すとルートが増えることを検出できる', () => {
    const carpet = buildCarpet(20, 7)
    const forked = carpet.rows.map((row, step) => {
      if (step !== 1) return row
      // 1 桁目の正解セルの隣に同じ数字を置く = 分岐した盤面を作る
      const twin = neighborCols(carpet.path[0], row.length).find(
        (col) => col !== carpet.path[1]
      ) as number
      return row.map((digit, col) => (col === twin ? PI_DIGITS[1] : digit))
    })

    expect(countPiRoutes({ ...carpet, rows: forked })).toBeGreaterThan(1)
  })
})
