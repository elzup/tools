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
  PLACEABLE_RADIUS,
  type TargetKind,
  buildTargets,
  clampToPool,
} from '../../components/WavePool/targets'

const K = (2 * Math.PI) / 0.2

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
  const kinds: TargetKind[] = ['point', 'twoPoints', 'ring', 'line', 'triangle']

  it.each(kinds)('%s のターゲットはプール内に収まる', (kind) => {
    const pts = buildTargets(kind, { x: 0.2, y: 0.1 }, [])
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
