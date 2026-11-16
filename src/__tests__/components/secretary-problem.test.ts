import {
  argmax,
  pickWithSkip,
  ranksOf,
  recordIndices,
  simulate,
  theoryPBest,
} from '../../components/SecretaryProblem/sim'

const UNIFORM = { kind: 'uniform', mean: 50, sd: 0 } as const
const NORMAL = { kind: 'normal', mean: 50, sd: 15 } as const

describe('pickWithSkip', () => {
  test('見送り中の最高を超えた最初の人を選ぶ', () => {
    expect(pickWithSkip([30, 80, 50, 90, 95], 2)).toEqual({
      index: 3,
      isFallback: false,
    })
  })
  test('誰も超えなければ最後の人で妥協する', () => {
    expect(pickWithSkip([99, 10, 20, 30], 1)).toEqual({
      index: 3,
      isFallback: true,
    })
  })
  test('k = 0 は最初の人を即採用', () => {
    expect(pickWithSkip([10, 20], 0).index).toBe(0)
  })
})

test('recordIndices / ranksOf', () => {
  expect(recordIndices([3, 1, 4, 1, 5])).toEqual([0, 2, 4])
  expect(ranksOf([3, 1, 4])).toEqual([2, 3, 1])
})

test('理論値は n = 100 で k = 37 付近が最大の約 37%', () => {
  const theory = Array.from({ length: 100 }, (_, k) => theoryPBest(100, k))
  expect(argmax(theory)).toBe(37)
  expect(theory[37]).toBeCloseTo(0.371, 3)
})

test('simulate の各 k は pickWithSkip と同じ人を選ぶ前提で理論値に近づく', () => {
  const stats = simulate(20, UNIFORM, 20000, 42)
  stats.forEach((s) => {
    expect(Math.abs(s.pBest - theoryPBest(20, s.k))).toBeLessThan(0.02)
  })
})

test('最良を選ぶ確率は分布によらないが、平均実力の最適 k は 37% より早い', () => {
  const uni = simulate(100, UNIFORM, 3000, 7)
  const norm = simulate(100, NORMAL, 3000, 7)
  // 同じシードで一様乱数を引くため順位が同じとは限らないので統計誤差で比べる
  expect(Math.abs(uni[37].pBest - norm[37].pBest)).toBeLessThan(0.04)
  expect(argmax(uni.map((s) => s.meanScore))).toBeLessThan(30)
  expect(argmax(norm.map((s) => s.meanScore))).toBeLessThan(30)
})
