import {
  arrivalPhase,
  ringPositions,
  timeReversalDrive,
  uniformDrive,
  wrapPhase,
} from '../../components/WavePool/drive'
import {
  advance,
  createPool,
  focusRatio,
  omegaOf,
  placeSources,
  toCell,
} from '../../components/WavePool/sim'
import {
  GS_ITERATIONS,
  hologramDrive,
  targetAmplitudes,
} from '../../components/WavePool/hologram'
import { outlineFromMask } from '../../components/WavePool/icons'
import {
  PLACEABLE_RADIUS,
  type ShapeKind,
  buildTargets,
  clampToPool,
  samplePath,
} from '../../components/WavePool/targets'

const K = (2 * Math.PI) / 0.2
// 実画面と同じ比率 (λ = 16 セル、半径 99 セル) の刻み幅
const SPACING = 8 / 99

describe('timeReversalDrive', () => {
  const sources = ringPositions(48, { x: 0, y: 0 }, 1)

  it('1 点ターゲットでは全波源の到達位相が揃う', () => {
    const target = { x: 0.3, y: -0.2 }
    const drives = timeReversalDrive(sources, [target], K)
    sources.forEach((src, j) => {
      expect(arrivalPhase(src, drives[j], target, K)).toBeCloseTo(0, 6)
    })
  })

  it('振幅は最大 1 に正規化され、近い波源ほど大きい (1/√r)', () => {
    const target = { x: 0.6, y: 0 }
    const drives = timeReversalDrive(sources, [target], K)
    expect(Math.max(...drives.map((d) => d.amp))).toBeCloseTo(1, 9)
    // j=0 は +x 方向で最も近く、j=24 は反対側で最も遠い
    expect(drives[0].amp).toBeCloseTo(1, 9)
    expect(drives[24].amp).toBeLessThan(drives[0].amp)
  })

  it('中心ターゲットは等距離なので全波源が同振幅・同位相', () => {
    const drives = timeReversalDrive(sources, [{ x: 0, y: 0 }], K)
    const phase0 = drives[0].phase
    drives.forEach((d) => {
      expect(d.amp).toBeCloseTo(1, 9)
      expect(wrapPhase(d.phase - phase0)).toBeCloseTo(0, 9)
    })
  })

  it('ターゲットが無ければ一様駆動に戻る', () => {
    expect(timeReversalDrive(sources, [], K)).toEqual(uniformDrive(48))
  })
})

describe('wrapPhase', () => {
  it('-π..π に畳む', () => {
    expect(wrapPhase(3 * Math.PI + 0.1)).toBeCloseTo(-Math.PI + 0.1, 9)
    expect(wrapPhase(-0.5)).toBeCloseTo(-0.5, 9)
  })
})

describe('targets', () => {
  const kinds: ShapeKind[] = ['point', 'twoPoints', 'ring', 'line', 'triangle']

  it.each(kinds)('%s のターゲットはプール内に収まる', (kind) => {
    const pts = buildTargets(kind, { x: 0.2, y: 0.1 }, [], SPACING)
    expect(pts.length).toBeGreaterThan(0)
    pts.forEach((p) => {
      expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(PLACEABLE_RADIUS)
    })
  })

  it('clampToPool は外側の点を縁へ寄せる', () => {
    const p = clampToPool({ x: 3, y: 4 })
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(PLACEABLE_RADIUS, 9)
  })
})

const cv = (values: number[]) => {
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance =
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance) / mean
}

describe('hologramDrive', () => {
  const sources = ringPositions(64, { x: 0, y: 0 }, 1)
  // λ = 0.16 (プール半径比)。実画面の λ = 16 セル / 半径 99 セルに近い
  const k = (2 * Math.PI) / 0.16
  const triangle = buildTargets('triangle', { x: 0, y: 0 }, [], 0.08)

  it('1 点ターゲットでは時間反転と同じく全波源の到達位相が揃う', () => {
    const target = { x: 0.3, y: -0.2 }
    const drives = hologramDrive(sources, [target], k)
    sources.forEach((src, j) => {
      expect(arrivalPhase(src, drives[j], target, k)).toBeCloseTo(0, 6)
    })
  })

  it('三角形の各点の明るさが時間反転の単純和より揃い、最暗点も明るい', () => {
    const gs = targetAmplitudes(
      sources,
      hologramDrive(sources, triangle, k),
      triangle,
      k
    )
    const tr = targetAmplitudes(
      sources,
      timeReversalDrive(sources, triangle, k),
      triangle,
      k
    )
    expect(cv(gs)).toBeLessThan(0.2)
    expect(cv(gs)).toBeLessThan(cv(tr))
    expect(Math.min(...gs)).toBeGreaterThan(Math.min(...tr))
  })

  it('反復 1 回は時間反転の単純和と一致する', () => {
    const once = hologramDrive(sources, triangle, k, 1)
    const tr = timeReversalDrive(sources, triangle, k)
    once.forEach((d, j) => {
      expect(d.amp).toBeCloseTo(tr[j].amp, 9)
      expect(wrapPhase(d.phase - tr[j].phase)).toBeCloseTo(0, 9)
    })
    expect(GS_ITERATIONS).toBeGreaterThan(1)
  })
})

describe('samplePath', () => {
  it('閉じた正方形を周長 / 間隔の点数で、継ぎ目を重ねずに刻む', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ]
    const pts = samplePath(square, 0.5, true)
    expect(pts).toHaveLength(8)
    expect(pts[0]).toEqual({ x: 0, y: 0 })
    expect(pts[1].x).toBeCloseTo(0.5, 9)
  })

  it('開いた線分は両端を含む', () => {
    const pts = samplePath(
      [
        { x: -1, y: 0 },
        { x: 1, y: 0 },
      ],
      0.5,
      false
    )
    expect(pts).toHaveLength(5)
    expect(pts[4].x).toBeCloseTo(1, 9)
  })
})

describe('outlineFromMask', () => {
  it('円盤マスクから縁の点を間隔以上離して拾う', () => {
    const size = 100
    const inside = (x: number, y: number) =>
      Math.hypot(x + 0.5 - 50, y + 0.5 - 50) < 40
    const spacing = 0.1
    const pts = outlineFromMask(inside, size, 0.5, spacing)
    // 半径 0.4 の円周 ≈ 2.51 を 0.1 間隔で刻むと 20 点台
    expect(pts.length).toBeGreaterThan(18)
    expect(pts.length).toBeLessThan(30)
    pts.forEach((p, i) => {
      expect(Math.hypot(p.x, p.y)).toBeCloseTo(0.4, 1)
      pts.slice(i + 1).forEach((q) => {
        expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThanOrEqual(spacing)
      })
    })
  })
})

describe('wave simulation', () => {
  const totalEnergy = (field: Float32Array) =>
    field.reduce((acc, v) => acc + v * v, 0)

  it('駆動なしでは減衰で振動が収まり、発散しない', () => {
    const pool = createPool(64, 'fixed', 0.01)
    const center = Math.round(pool.center.y) * 64 + Math.round(pool.center.x)
    pool.cur[center] = 1
    pool.prev[center] = 1
    advance(pool, [], [], 0, 50)
    const early = totalEnergy(pool.cur)
    advance(pool, [], [], 0, 2000)
    const late = totalEnergy(pool.cur)
    expect(Number.isFinite(late)).toBe(true)
    expect(late).toBeLessThan(early)
  })

  it('位相制御すると中心から外れたターゲットへの集中度が上がる', () => {
    const size = 96
    const wavelength = 12
    const run = (phaseControl: boolean) => {
      const pool = createPool(size, 'absorb', 0.004)
      const sources = placeSources(pool, 48)
      const target = toCell(pool, { x: 0.4, y: 0.25 })
      const drives = phaseControl
        ? timeReversalDrive(
            sources.map((s) => s.pos),
            [target],
            omegaOf(wavelength)
          )
        : uniformDrive(sources.length)
      advance(pool, sources, drives, omegaOf(wavelength), 1600)
      return focusRatio(pool, [target], 2)
    }
    const controlled = run(true)
    const uniform = run(false)
    expect(controlled).toBeGreaterThan(2)
    expect(controlled).toBeGreaterThan(uniform * 2)
  })
})
