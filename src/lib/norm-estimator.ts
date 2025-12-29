/**
 * 正規分布推定ロジック
 * 部分的な条件から平均値・標準偏差を自動推定する
 */

// 標準正規分布の CDF (累積分布関数)
export function normalCDF(z: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = z < 0 ? -1 : 1
  z = Math.abs(z)

  const t = 1.0 / (1.0 + p * z)
  const y =
    1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z)

  return 0.5 * (1.0 + sign * y)
}

// 標準正規分布の逆 CDF (probit function)
// Rational approximation (Abramowitz and Stegun)
export function normalInvCDF(p: number): number {
  if (p <= 0) return -Infinity
  if (p >= 1) return Infinity

  // 0.5 の場合は 0
  if (Math.abs(p - 0.5) < 1e-10) return 0

  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0,
  ]
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ]
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ]
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ]

  const pLow = 0.02425
  const pHigh = 1 - pLow

  let q: number, r: number

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p))
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    )
  } else if (p <= pHigh) {
    q = p - 0.5
    r = q * q
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
        q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    )
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p))
    return (
      -(
        (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
      )
    )
  }
}

// 条件の型定義
export type ConditionType =
  | 'value-percentage' // 「x点以上は上位y%」
  | 'percentile-value' // 「上位x%の境界値はy」

export type Condition = {
  id: string
  type: ConditionType
  value?: number // 点数
  percentage?: number // パーセント (0-100)
}

// パラメータ
export type DistributionParams = {
  totalCount?: number
  mean?: number
  stdDev?: number
  conditions: Condition[]
}

// 推定結果
export type EstimationResult = {
  mean: number
  stdDev: number
  totalCount?: number
  isValid: boolean
  error?: string
  warnings: string[]
  inputFields: string[]
  estimatedFields: string[]
  conditionsFit: Array<{
    id: string
    label: string
    expected: number
    actual: number
    error: number
  }>
  percentiles: { [key: number]: number }
}

// 条件からパーセンタイルと値のペアを抽出
function extractPercentileValuePairs(
  conditions: Condition[]
): Array<{ percentile: number; value: number }> {
  const pairs: Array<{ percentile: number; value: number }> = []

  for (const cond of conditions) {
    if (cond.value === undefined || cond.percentage === undefined) continue

    if (cond.type === 'value-percentage') {
      // 「x点以上は上位y%」→ x点は (100-y) パーセンタイル
      const percentile = 100 - cond.percentage
      pairs.push({ percentile, value: cond.value })
    } else if (cond.type === 'percentile-value') {
      // 「上位x%の境界値はy」→ y点は (100-x) パーセンタイル
      const percentile = 100 - cond.percentage
      pairs.push({ percentile, value: cond.value })
    }
  }

  return pairs
}

// 2つの条件から μ と σ を推定
function estimateFromTwoConditions(
  pairs: Array<{ percentile: number; value: number }>
): { mean: number; stdDev: number } | null {
  if (pairs.length < 2) return null

  // X = μ + σ * z(p)
  // X1 = μ + σ * z1
  // X2 = μ + σ * z2
  // σ = (X1 - X2) / (z1 - z2)
  // μ = X1 - σ * z1

  const p1 = pairs[0].percentile / 100
  const p2 = pairs[1].percentile / 100
  const x1 = pairs[0].value
  const x2 = pairs[1].value

  const z1 = normalInvCDF(p1)
  const z2 = normalInvCDF(p2)

  if (Math.abs(z1 - z2) < 1e-10) {
    return null // z値が同じだと計算できない
  }

  const sigma = (x1 - x2) / (z1 - z2)
  const mu = x1 - sigma * z1

  if (sigma <= 0) {
    return null // 標準偏差は正である必要がある
  }

  return { mean: mu, stdDev: sigma }
}

// 条件が3つ以上の場合、最小二乗法で最適な μ, σ を算出
function estimateFromMultipleConditions(
  pairs: Array<{ percentile: number; value: number }>
): { mean: number; stdDev: number } | null {
  if (pairs.length < 2) return null

  // 最小二乗法: Σ(Xi - μ - σ*zi)² を最小化
  // 解析的に解ける

  const zs = pairs.map((p) => normalInvCDF(p.percentile / 100))
  const xs = pairs.map((p) => p.value)
  const n = pairs.length

  const sumX = xs.reduce((a, b) => a + b, 0)
  const sumZ = zs.reduce((a, b) => a + b, 0)
  const sumZ2 = zs.reduce((a, b) => a + b * b, 0)
  const sumXZ = xs.reduce((a, x, i) => a + x * zs[i], 0)

  const denom = n * sumZ2 - sumZ * sumZ
  if (Math.abs(denom) < 1e-10) {
    return null
  }

  const sigma = (n * sumXZ - sumX * sumZ) / denom
  const mu = (sumX - sigma * sumZ) / n

  if (sigma <= 0) {
    return null
  }

  return { mean: mu, stdDev: sigma }
}

// メイン推定関数
export function estimateDistribution(
  params: DistributionParams
): EstimationResult {
  const warnings: string[] = []
  const inputFields: string[] = []
  const estimatedFields: string[] = []
  const conditionsFit: EstimationResult['conditionsFit'] = []

  // 直接入力されたパラメータをチェック
  let mean = params.mean
  let stdDev = params.stdDev

  if (mean !== undefined) inputFields.push('平均値')
  if (stdDev !== undefined) inputFields.push('標準偏差')

  // 条件からペアを抽出
  const pairs = extractPercentileValuePairs(params.conditions)

  // μ と σ の推定
  if (mean === undefined || stdDev === undefined) {
    if (pairs.length >= 2) {
      // 条件から推定
      const estimated =
        pairs.length === 2
          ? estimateFromTwoConditions(pairs)
          : estimateFromMultipleConditions(pairs)

      if (estimated) {
        if (mean === undefined) {
          mean = estimated.mean
          estimatedFields.push('平均値')
        }
        if (stdDev === undefined) {
          stdDev = estimated.stdDev
          estimatedFields.push('標準偏差')
        }
      }
    } else if (pairs.length === 1 && (mean !== undefined || stdDev !== undefined)) {
      // 1つの条件と1つの既知パラメータから推定
      const p = pairs[0].percentile / 100
      const x = pairs[0].value
      const z = normalInvCDF(p)

      if (mean !== undefined && stdDev === undefined) {
        // μ が既知、σ を推定
        stdDev = (x - mean) / z
        if (stdDev > 0) {
          estimatedFields.push('標準偏差')
        } else {
          stdDev = undefined
        }
      } else if (stdDev !== undefined && mean === undefined) {
        // σ が既知、μ を推定
        mean = x - stdDev * z
        estimatedFields.push('平均値')
      }
    }
  }

  // 推定できなかった場合
  if (mean === undefined || stdDev === undefined) {
    return {
      mean: mean ?? 0,
      stdDev: stdDev ?? 0,
      isValid: false,
      error:
        '推定に必要な条件が不足しています。少なくとも2つの条件を入力するか、平均値/標準偏差を直接指定してください。',
      warnings,
      inputFields,
      estimatedFields,
      conditionsFit,
      percentiles: {},
    }
  }

  // 条件の整合性チェック
  for (const pair of pairs) {
    const z = normalInvCDF(pair.percentile / 100)
    const expectedValue = mean + stdDev * z
    const error = Math.abs(pair.value - expectedValue)
    const errorPercent = (error / stdDev) * 100

    conditionsFit.push({
      id: `pair-${pair.percentile}`,
      label: `${pair.percentile}パーセンタイル: ${pair.value}点`,
      expected: pair.value,
      actual: expectedValue,
      error: errorPercent,
    })

    if (errorPercent > 10) {
      warnings.push(
        `条件の整合性が低い: ${pair.percentile}パーセンタイルの誤差が${errorPercent.toFixed(1)}%`
      )
    }
  }

  // パーセンタイル計算
  const percentilePoints = [1, 5, 10, 25, 50, 75, 90, 95, 99]
  const percentiles: { [key: number]: number } = {}
  for (const p of percentilePoints) {
    const z = normalInvCDF(p / 100)
    percentiles[p] = mean + stdDev * z
  }

  return {
    mean,
    stdDev,
    totalCount: params.totalCount,
    isValid: true,
    warnings,
    inputFields,
    estimatedFields,
    conditionsFit,
    percentiles,
  }
}

// 正規分布 PDF
export function normalPDF(x: number, mean: number, stdDev: number): number {
  const z = (x - mean) / stdDev
  return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z)
}

// 点数からパーセンタイルを計算
export function valueToPercentile(
  value: number,
  mean: number,
  stdDev: number
): number {
  const z = (value - mean) / stdDev
  return normalCDF(z) * 100
}

// パーセンタイルから点数を計算
export function percentileToValue(
  percentile: number,
  mean: number,
  stdDev: number
): number {
  const z = normalInvCDF(percentile / 100)
  return mean + stdDev * z
}
