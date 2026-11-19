import {
  BETA,
  createWorld,
  force,
  snakeMatrix,
  step,
  symmetricMatrix,
  wrapDelta,
  zeroMatrix,
} from '../../components/ParticleLife/particleLife'

// 再現性のための線形合同法
const seeded = (seed: number) => {
  let s = seed

  return () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32
    return s / 2 ** 32
  }
}

const params = { rMax: 0.1, frictionHalfLife: 0.04, forceFactor: 10 }

describe('force', () => {
  test('近距離は係数に関係なく反発 (負)', () => {
    expect(force(0, 1)).toBe(-1)
    expect(force(BETA / 2, 1)).toBeLessThan(0)
    expect(force(BETA / 2, -1)).toBe(force(BETA / 2, 1))
  })
  test('中間距離で係数 a が最大になる', () => {
    const mid = (1 + BETA) / 2

    expect(force(mid, 0.7)).toBeCloseTo(0.7)
    expect(force(mid, -0.4)).toBeCloseTo(-0.4)
  })
  test('rMax 以遠は 0', () => {
    expect(force(1, 1)).toBe(0)
    expect(force(1.5, -1)).toBe(0)
  })
  test('BETA と 1 で連続', () => {
    expect(force(BETA, 1)).toBeCloseTo(0)
    expect(force(0.999999, 1)).toBeCloseTo(0, 4)
  })
})

describe('wrapDelta', () => {
  test('トーラス上の最短差分を返す', () => {
    expect(wrapDelta(0.9)).toBeCloseTo(-0.1)
    expect(wrapDelta(-0.9)).toBeCloseTo(0.1)
    expect(wrapDelta(0.3)).toBeCloseTo(0.3)
  })
})

describe('matrix presets', () => {
  test('symmetricMatrix は転置と一致', () => {
    const m = symmetricMatrix(5, seeded(1))

    m.forEach((row, i) => {
      row.forEach((v, j) => {
        expect(v).toBe(m[j][i])
      })
    })
  })
  test('snakeMatrix は自分 1・次 0.2', () => {
    const m = snakeMatrix(3)

    expect(m[0]).toEqual([1, 0.2, 0])
    expect(m[2]).toEqual([0.2, 0, 1])
  })
})

describe('step', () => {
  test('位置は常に [0,1) に収まる', () => {
    const world = createWorld(300, 4, seeded(2))
    const m = symmetricMatrix(4, seeded(3))

    for (let k = 0; k < 30; k++) step(world, m, params, 0.02)
    for (let i = 0; i < world.count; i++) {
      expect(world.x[i]).toBeGreaterThanOrEqual(0)
      expect(world.x[i]).toBeLessThan(1)
      expect(world.y[i]).toBeGreaterThanOrEqual(0)
      expect(world.y[i]).toBeLessThan(1)
    }
  })
  test('近すぎる 2 粒子は係数 0 でも離れる', () => {
    const world = createWorld(2, 1, seeded(4))

    world.x.set([0.5, 0.505])
    world.y.set([0.5, 0.5])
    step(world, zeroMatrix(1), params, 0.02)
    expect(world.x[1] - world.x[0]).toBeGreaterThan(0.005)
  })
  test('near は rMax 内の他粒子数', () => {
    const world = createWorld(3, 1, seeded(6))

    world.x.set([0.5, 0.55, 0.9])
    world.y.set([0.5, 0.5, 0.5])
    step(world, zeroMatrix(1), params, 0.02)
    expect(Array.from(world.near)).toEqual([1, 1, 0])
  })
  test('境界をまたいだ近傍にも力が届く', () => {
    const world = createWorld(2, 1, seeded(5))

    world.x.set([0.002, 0.998])
    world.y.set([0.5, 0.5])
    step(world, zeroMatrix(1), params, 0.02)
    // 0 側は +x へ、1 側は -x へ押し出される
    expect(world.vx[0]).toBeGreaterThan(0)
    expect(world.vx[1]).toBeLessThan(0)
  })
})
