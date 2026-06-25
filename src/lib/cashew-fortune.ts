import {
  Bodies,
  Body,
  Composite,
  Constraint,
  Engine,
  Events,
  type Body as MatterBody,
} from 'matter-js'

export type CashewSide = 'innerUp' | 'innerDown'

export type CashewOutcome = 'bothInnerUp' | 'bothInnerDown' | 'split'

export type CashewSimulationSettings = {
  trials: number
  asymmetry: number
  launchEnergy: number
  damping: number
}

export type CashewSimulationResult = {
  trials: number
  innerUp: number
  innerDown: number
  pairCounts: Record<CashewOutcome, number>
  samples: Array<[CashewSide, CashewSide]>
}

type RandomSource = () => number

const TWO_PI = Math.PI * 2
const SIMULATION_STEP_MS = 1000 / 60
const MAX_STEPS = 360
const STABLE_FRAMES = 18
const DEFAULT_SAMPLE_SIZE = 18
const GRAVITY_Y = 1.15
export const CASHEW_STAGE = {
  minX: -240,
  maxX: 240,
  minY: -160,
  maxY: 220,
} as const

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const normalizeAngle = (angle: number) => {
  const normalized = angle % TWO_PI
  return normalized < 0 ? normalized + TWO_PI : normalized
}

export const classifyCashewSide = (angle: number): CashewSide => {
  const normalizedAngle = normalizeAngle(angle)
  return normalizedAngle < Math.PI ? 'innerUp' : 'innerDown'
}

export const getCashewOutcome = (
  first: CashewSide,
  second: CashewSide
): CashewOutcome => {
  if (first === 'innerUp' && second === 'innerUp') return 'bothInnerUp'
  if (first === 'innerDown' && second === 'innerDown') return 'bothInnerDown'
  return 'split'
}

const createCashewBody = (
  x: number,
  y: number,
  settings: CashewSimulationSettings,
  random: RandomSource
) => {
  const shapeBias = clamp(settings.asymmetry, -0.45, 0.45)
  const massBias = shapeBias * 14
  const hull = Bodies.polygon(0, 0, 6, 24, {
    density: 0.0018,
    friction: 0.9,
    frictionAir: clamp(settings.damping, 0.01, 0.3),
    restitution: 0.08,
  })
  Body.scale(hull, 1.15, 0.92)
  const ballast = Bodies.circle(massBias, 0, 6.5, {
    density: 0.012 + Math.abs(shapeBias) * 0.01,
    friction: 0.8,
    frictionAir: clamp(settings.damping, 0.01, 0.3),
    restitution: 0.02,
  })
  const body = Body.create({
    parts: [hull, ballast],
    friction: 0.9,
    frictionAir: clamp(settings.damping, 0.01, 0.3),
    restitution: 0.08,
  })

  Body.setPosition(body, { x, y })
  Body.setAngle(body, random() * TWO_PI)
  Body.setVelocity(body, {
    x: (random() - 0.5) * 2.2,
    y: -0.5 - random() * settings.launchEnergy,
  })
  Body.setAngularVelocity(
    body,
    (random() - 0.5) * (1.2 + settings.launchEnergy * 1.4)
  )

  return body
}

export const createCashewScene = (
  settings: CashewSimulationSettings,
  random: RandomSource
) => {
  const engine = Engine.create()
  engine.enableSleeping = true
  engine.gravity.y = GRAVITY_Y

  const floor = Bodies.rectangle(0, 180, 420, 28, {
    isStatic: true,
    friction: 1,
    restitution: 0.05,
  })
  const leftWall = Bodies.rectangle(-220, 30, 28, 280, {
    isStatic: true,
    friction: 1,
  })
  const rightWall = Bodies.rectangle(220, 30, 28, 280, {
    isStatic: true,
    friction: 1,
  })
  const shelf = Bodies.rectangle(0, 88, 110, 12, {
    isStatic: true,
    angle: -0.08,
    friction: 1,
    restitution: 0.02,
  })

  const first = createCashewBody(-14, -104, settings, random)
  const second = createCashewBody(14, -104, settings, random)
  const seam = Constraint.create({
    bodyA: first,
    bodyB: second,
    length: 4,
    stiffness: 0.92,
    damping: 0.06,
  })

  Composite.add(engine.world, [
    floor,
    leftWall,
    rightWall,
    shelf,
    first,
    second,
    seam,
  ])

  let hasSplit = false
  Events.on(engine, 'collisionStart', ({ pairs }) => {
    if (hasSplit) return

    const hitGround = pairs.some(
      (pair) =>
        pair.bodyA === floor ||
        pair.bodyB === floor ||
        pair.bodyA === shelf ||
        pair.bodyB === shelf
    )

    if (!hitGround) return

    hasSplit = true
    Composite.remove(engine.world, seam)
    Body.applyForce(first, first.position, { x: -0.03, y: -0.02 })
    Body.applyForce(second, second.position, { x: 0.03, y: -0.02 })
    Body.setAngularVelocity(first, first.angularVelocity - 0.08)
    Body.setAngularVelocity(second, second.angularVelocity + 0.08)
  })

  return { engine, first, second }
}

const isSettled = (body: MatterBody) => {
  const speed = Math.hypot(body.velocity.x, body.velocity.y)
  return (
    body.isSleeping || (speed < 0.04 && Math.abs(body.angularVelocity) < 0.04)
  )
}

export const simulateCashewPair = (
  settings: CashewSimulationSettings,
  random: RandomSource = Math.random
): [CashewSide, CashewSide] => {
  const { engine, first, second } = createCashewScene(settings, random)

  let stableFrames = 0
  for (let step = 0; step < MAX_STEPS; step++) {
    Engine.update(engine, SIMULATION_STEP_MS)

    if (isSettled(first) && isSettled(second)) {
      stableFrames += 1
      if (stableFrames >= STABLE_FRAMES) break
    } else {
      stableFrames = 0
    }
  }

  return [classifyCashewSide(first.angle), classifyCashewSide(second.angle)]
}

export const simulateCashewTrials = (
  settings: CashewSimulationSettings,
  random: RandomSource = Math.random
): CashewSimulationResult => {
  const trials = Math.max(1, Math.floor(settings.trials))
  const pairCounts: Record<CashewOutcome, number> = {
    bothInnerUp: 0,
    bothInnerDown: 0,
    split: 0,
  }
  const samples: Array<[CashewSide, CashewSide]> = []
  let innerUp = 0
  let innerDown = 0

  for (let index = 0; index < trials; index++) {
    const [first, second] = simulateCashewPair(settings, random)

    if (first === 'innerUp') innerUp += 1
    else innerDown += 1

    if (second === 'innerUp') innerUp += 1
    else innerDown += 1

    pairCounts[getCashewOutcome(first, second)] += 1

    if (samples.length < DEFAULT_SAMPLE_SIZE) {
      samples.push([first, second])
    }
  }

  return {
    trials,
    innerUp,
    innerDown,
    pairCounts,
    samples,
  }
}
