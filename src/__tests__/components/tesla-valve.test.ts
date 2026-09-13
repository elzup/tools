import {
  DEFAULT_PARAMS,
  type Geometry,
  type ValveParams,
  buildGeometry,
} from '../../components/TeslaValve/geometry'
import {
  advance,
  createLattice,
  flux,
  maxSpeed,
  omegaOf,
} from '../../components/TeslaValve/lbm'

// テスト用に 2 段の小さい領域で回す (形状の性質は段数に依らない)
const params: ValveParams = { ...DEFAULT_PARAMS, units: 2 }

const totalMass = ({ geo, rho }: { geo: Geometry; rho: Float32Array }) => {
  let sum = 0

  for (let idx = 0; idx < geo.nx * geo.ny; idx++) {
    if (geo.solid[idx] === 0) sum += rho[idx]
  }

  return sum
}

// 4 近傍 (x は周期境界) で流体セルを塗り、到達できたセル数を返す
const reachableFluid = (geo: Geometry): number => {
  const seen = new Uint8Array(geo.nx * geo.ny)
  const start = geo.solid.indexOf(0)
  const stack = [start]
  const steps = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]

  seen[start] = 1
  while (stack.length > 0) {
    const idx = stack.pop() as number
    const x = idx % geo.nx
    const y = (idx / geo.nx) | 0

    for (const [dx, dy] of steps) {
      const ty = y + dy

      if (ty < 0 || ty >= geo.ny) continue

      const next = ty * geo.nx + ((x + dx + geo.nx) % geo.nx)

      if (seen[next] === 1 || geo.solid[next] === 1) continue
      seen[next] = 1
      stack.push(next)
    }
  }

  return seen.reduce((sum: number, hit) => sum + hit, 0)
}

const diodicity = (
  valve: ValveParams,
  viscosity: number,
  targetU: number,
  steps: number
) => {
  const geo = buildGeometry(valve)
  const force =
    (3 * viscosity * targetU) / (valve.channelHalf * valve.channelHalf)
  const forward = createLattice(geo, { viscosity, force })
  const reverse = createLattice(geo, { viscosity, force: -force })

  advance(forward, steps)
  advance(reverse, steps)

  return {
    qf: flux(forward),
    qr: -flux(reverse),
    d: flux(forward) / -flux(reverse),
  }
}

describe('geometry', () => {
  const geo = buildGeometry(params)

  test('流路は一つに繋がっている (ループが壁で塞がっていない)', () => {
    expect(geo.fluidCount).toBeGreaterThan(0)
    expect(reachableFluid(geo)).toBe(geo.fluidCount)
  })

  test('ループを上下交互に振るので 2 段で周期になる', () => {
    const period = params.unitLength * 2

    for (let y = 0; y < geo.ny; y++) {
      for (let x = 0; x < geo.nx - period; x++) {
        expect(geo.solid[y * geo.nx + x]).toBe(
          geo.solid[y * geo.nx + x + period]
        )
      }
    }
  })

  test('左右非対称。これが整流比の源なので鏡像と一致してはいけない', () => {
    const mirrored = Array.from({ length: geo.nx * geo.ny }, (_, idx) => {
      const x = idx % geo.nx
      const y = (idx / geo.nx) | 0

      return geo.solid[y * geo.nx + (geo.nx - 1 - x)]
    })

    expect(mirrored.some((solid, idx) => solid !== geo.solid[idx])).toBe(true)
  })

  test('外周は壁', () => {
    for (let x = 0; x < geo.nx; x++) {
      expect(geo.solid[x]).toBe(1)
      expect(geo.solid[(geo.ny - 1) * geo.nx + x]).toBe(1)
    }
  })
})

describe('lbm', () => {
  test('緩和時間は粘性から決まり、安定範囲 (0<ω<2) に入る', () => {
    expect(omegaOf(1 / 6)).toBeCloseTo(1)
    expect(omegaOf(0.005)).toBeLessThan(2)
    expect(omegaOf(0.03)).toBeGreaterThan(0)
  })

  test('力を掛けなければ静止したまま (平衡分布が不動点)', () => {
    const lattice = createLattice(buildGeometry(params), {
      viscosity: 0.01,
      force: 0,
    })

    advance(lattice, 50)
    expect(flux(lattice)).toBeCloseTo(0, 6)
    expect(maxSpeed(lattice)).toBeLessThan(1e-6)
  })

  test('質量が保存する (バウンスバック壁から漏れない)', () => {
    const lattice = createLattice(buildGeometry(params), {
      viscosity: 0.01,
      force: 2e-5,
    })

    advance(lattice, 1)
    const before = totalMass(lattice)

    advance(lattice, 300)
    expect(totalMass(lattice) / before).toBeCloseTo(1, 4)
  })

  test('直管の流量が平面ポアズイユ流の理論値に一致する', () => {
    const straight: ValveParams = { ...params, loops: false, waveAmp: 0 }
    const targetU = 0.05
    const { qf } = diodicity(straight, 0.02, targetU, 6000)
    const width = straight.channelHalf * 2

    // 壁位置がバウンスバックで半セルずれるため 1 割の幅を見る
    expect(qf / width / targetU).toBeGreaterThan(0.9)
    expect(qf / width / targetU).toBeLessThan(1.1)
  }, 60000)
})

describe('整流 (diodicity)', () => {
  test('ループが無ければ向きによらず同じ流量 (D≒1)', () => {
    const { d } = diodicity({ ...params, loops: false }, 0.008, 0.06, 2000)

    expect(d).toBeCloseTo(1, 2)
  }, 60000)

  test('ループがあると順方向のほうが流れる (D>1.2)', () => {
    const { qf, qr, d } = diodicity(params, 0.008, 0.06, 3000)

    expect(qf).toBeGreaterThan(qr)
    expect(d).toBeGreaterThan(1.2)
  }, 60000)
})
