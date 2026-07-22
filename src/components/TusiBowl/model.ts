export const GRAVITY = 9.81
export const BOWL_RADIUS = 5
export const BALL_RADIUS = 0.25
export const PENDULUM_LENGTH = BOWL_RADIUS - BALL_RADIUS
export const BOWL_CENTER_Y = BOWL_RADIUS
export const DROP_ANGLE = (Math.PI / 180) * 60
export const BOWL_CAP_ANGLE = (Math.PI / 180) * 80
export const PERFECT_MS = 100
export const GOOD_MS = 250
export const TWO_PI = Math.PI * 2

export type BallSpec = {
  id: number
  theta: number
  color: string
}

export type NavMode = 'off' | 'manual' | 'touch'
export type ViewRequest = { mode: 'side' | 'top'; revision: number }
export type Judgement = {
  text: string
  tone: 'perfect' | 'good' | 'miss'
}

// T = 4√(L/g)・K(sin(α/2))。K は AGM で数値計算する。
export const pendulumPeriod = (length: number, amplitude: number): number => {
  const modulus = Math.sin(amplitude / 2)
  let arithmeticMean = 1
  let geometricMean = Math.sqrt(1 - modulus * modulus)

  for (
    let iteration = 0;
    iteration < 30 && Math.abs(arithmeticMean - geometricMean) > 1e-12;
    iteration++
  ) {
    const nextArithmeticMean = (arithmeticMean + geometricMean) / 2
    geometricMean = Math.sqrt(arithmeticMean * geometricMean)
    arithmeticMean = nextArithmeticMean
  }

  const ellipticIntegral = Math.PI / (2 * arithmeticMean)
  return 4 * Math.sqrt(length / GRAVITY) * ellipticIntegral
}

export const PERIOD = pendulumPeriod(PENDULUM_LENGTH, DROP_ANGLE)
export const OMEGA = TWO_PI / PERIOD
export const RIM_RADIUS = PENDULUM_LENGTH * Math.sin(DROP_ANGLE)
export const SPAWN_Y = BOWL_CENTER_Y - PENDULUM_LENGTH * Math.cos(DROP_ANGLE)

export const nowSeconds = (): number => performance.now() / 1000

export const goodAngleAt = (time: number): number =>
  (((OMEGA * time) % TWO_PI) + TWO_PI) % TWO_PI

export const wrapAngle = (angle: number): number => {
  const normalizedAngle = ((angle % TWO_PI) + TWO_PI) % TWO_PI

  return normalizedAngle > Math.PI ? normalizedAngle - TWO_PI : normalizedAngle
}

export const spawnPosition = (theta: number): [number, number, number] => [
  RIM_RADIUS * Math.cos(theta),
  SPAWN_Y,
  RIM_RADIUS * Math.sin(theta),
]

export const judgeTiming = (errorMilliseconds: number): Judgement => {
  const roundedMilliseconds = Math.round(errorMilliseconds)

  if (errorMilliseconds < PERFECT_MS) {
    return { text: `Perfect! ${roundedMilliseconds}ms`, tone: 'perfect' }
  }
  if (errorMilliseconds < GOOD_MS) {
    return { text: `Good ${roundedMilliseconds}ms`, tone: 'good' }
  }
  return {
    text: `Miss… ${roundedMilliseconds}ms ずれ`,
    tone: 'miss',
  }
}
