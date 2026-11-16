export type DistKind = 'uniform' | 'normal'

export type DistParams = {
  kind: DistKind
  /** 正規分布の平均 */
  mean: number
  /** 正規分布の標準偏差 */
  sd: number
}

export type KStat = {
  k: number
  /** 最良の 1 人を選べた割合 */
  pBest: number
  /** 選んだ人の実力の平均 */
  meanScore: number
  /** 選んだ人の順位の平均 (1 = 最良) */
  meanRank: number
  /** 見送り後に誰も基準を超えず、最後の人で妥協した割合 */
  pFallback: number
}

export type Pick = {
  index: number
  isFallback: boolean
}

/** 再現可能な乱数列が要るので Math.random ではなく seed 付き PRNG を使う */
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Box–Muller 法。u1 = 0 で log(0) にならないよう 1 - rand を使う */
const gaussian = (rand: () => number) => {
  const u1 = 1 - rand()
  const u2 = rand()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

export const sampleScore = (dist: DistParams, rand: () => number) =>
  dist.kind === 'uniform' ? rand() * 100 : dist.mean + dist.sd * gaussian(rand)

export const sampleCandidates = (
  n: number,
  dist: DistParams,
  rand: () => number
) => Array.from({ length: n }, () => sampleScore(dist, rand))

/**
 * 最初の k 人を見送り、それまでの最高を超えた最初の人を選ぶ。
 * 誰も超えなければ最後の人を選ぶ。k = 0 は「最初の人を即採用」。
 */
export const pickWithSkip = (scores: number[], k: number): Pick => {
  const threshold = Math.max(-Infinity, ...scores.slice(0, k))
  const found = scores.findIndex((v, i) => i >= k && v > threshold)
  return found === -1
    ? { index: scores.length - 1, isFallback: true }
    : { index: found, isFallback: false }
}

/** 左から見た暫定 1 位 (記録) の位置。最初の要素は必ず含む */
export const recordIndices = (scores: number[]) =>
  scores.reduce<{ max: number; list: number[] }>(
    (acc, v, i) => (v > acc.max ? { max: v, list: [...acc.list, i] } : acc),
    { max: -Infinity, list: [] }
  ).list

/** 各要素の順位 (1 = 最大)。毎回 filter すると O(n^2) になるので 1 回ソートする */
export const ranksOf = (scores: number[]) => {
  const order = scores.map((_, i) => i).sort((a, b) => scores[b] - scores[a])
  return order
    .map((idx, pos) => [idx, pos + 1] as const)
    .sort((a, b) => a[0] - b[0])
    .map(([, rank]) => rank)
}

type Acc = { best: number; score: number; rank: number; fallback: number }

/**
 * 全 k を同じ候補者列で評価する (共通乱数)。k ごとに別の列を引くより
 * 曲線のギザつきが小さく、k 同士の比較が公平になる。
 * k で選ばれるのは「位置 k 以上の最初の記録」なので、記録列を 1 回求めれば
 * 全 k を O(n) で走査できる。
 */
export const simulate = (
  n: number,
  dist: DistParams,
  trials: number,
  seed: number
): KStat[] => {
  const rand = mulberry32(seed)
  const zero: Acc = { best: 0, score: 0, rank: 0, fallback: 0 }
  const totals = Array.from({ length: trials }).reduce<Acc[]>(
    (acc) => {
      const scores = sampleCandidates(n, dist, rand)
      const records = recordIndices(scores)
      const bestIndex = records[records.length - 1]
      const ranks = ranksOf(scores)
      return acc.map((a, k) => {
        const next = records.find((r) => r >= k)
        const index = next === undefined ? n - 1 : next
        return {
          best: a.best + (index === bestIndex ? 1 : 0),
          score: a.score + scores[index],
          rank: a.rank + ranks[index],
          fallback: a.fallback + (next === undefined ? 1 : 0),
        }
      })
    },
    Array.from({ length: n }, () => zero)
  )
  return totals.map((t, k) => ({
    k,
    pBest: t.best / trials,
    meanScore: t.score / trials,
    meanRank: t.rank / trials,
    pFallback: t.fallback / trials,
  }))
}

/** 理論値: k 人見送ったとき最良を選ぶ確率 (k/n) Σ_{i=k}^{n-1} 1/i。k = 0 は 1/n */
export const theoryPBest = (n: number, k: number) => {
  if (k === 0) return 1 / n
  const harmonic = Array.from({ length: n - k }, (_, j) => 1 / (k + j)).reduce(
    (s, v) => s + v,
    0
  )
  return (k / n) * harmonic
}

export const argmax = (values: number[]) =>
  values.reduce((best, v, i) => (v > values[best] ? i : best), 0)
