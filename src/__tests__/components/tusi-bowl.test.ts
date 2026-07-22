import {
  OMEGA,
  PERIOD,
  RIM_RADIUS,
  SPAWN_Y,
  TWO_PI,
  goodAngleAt,
  judgeTiming,
  pendulumPeriod,
  spawnPosition,
  wrapAngle,
} from '../../components/TusiBowl/model'

describe('TusiBowl model', () => {
  test('振幅が大きいほど振り子の周期が長くなる', () => {
    const smallAmplitude = pendulumPeriod(4.75, 0.1)
    const largeAmplitude = pendulumPeriod(4.75, Math.PI / 3)

    expect(largeAmplitude).toBeGreaterThan(smallAmplitude)
  })

  test('角度を -π 以上 π 以下に正規化する', () => {
    expect(wrapAngle(TWO_PI + Math.PI / 2)).toBeCloseTo(Math.PI / 2)
    expect(wrapAngle(-TWO_PI - Math.PI / 2)).toBeCloseTo(-Math.PI / 2)
  })

  test('ナビ角度は一周期後に同じ位置へ戻る', () => {
    expect(goodAngleAt(1 + PERIOD)).toBeCloseTo(goodAngleAt(1))
    expect(OMEGA * PERIOD).toBeCloseTo(TWO_PI)
  })

  test('配置位置は常にリム上にある', () => {
    const [x, y, z] = spawnPosition(Math.PI / 3)

    expect(Math.hypot(x, z)).toBeCloseTo(RIM_RADIUS)
    expect(y).toBe(SPAWN_Y)
  })

  test.each([
    [99, 'perfect'],
    [100, 'good'],
    [249, 'good'],
    [250, 'miss'],
  ] as const)('%dms を %s と判定する', (milliseconds, tone) => {
    expect(judgeTiming(milliseconds).tone).toBe(tone)
  })
})
