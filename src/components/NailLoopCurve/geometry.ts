const TAU = Math.PI * 2
const CURVE_POINT_COUNT = 380
const SEARCH_ITERATIONS = 42

export type Point = { x: number; y: number }
export type ArcKey = 'ab' | 'bc' | 'ca'
export type CurvePoint = Point & { arc: ArcKey }
export type Curve = {
  points: CurvePoint[]
  trianglePerimeter: number
  loopLength: number
}
export type TaggedPoint = Point & { tag: number }

export const distance = (a: Point, b: Point): number =>
  Math.hypot(a.x - b.x, a.y - b.y)

const cross = (origin: Point, a: Point, b: Point): number =>
  (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x)

const buildHalfHull = (points: TaggedPoint[]): TaggedPoint[] => {
  const halfHull: TaggedPoint[] = []

  points.forEach((point) => {
    while (
      halfHull.length >= 2 &&
      cross(
        halfHull[halfHull.length - 2],
        halfHull[halfHull.length - 1],
        point
      ) <= 0
    ) {
      halfHull.pop()
    }
    halfHull.push(point)
  })

  return halfHull
}

// 4 点までの凸包を反時計回りで返す。
export const convexHull = (points: TaggedPoint[]): TaggedPoint[] => {
  const sortedPoints = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  const lowerHull = buildHalfHull(sortedPoints)
  const upperHull = buildHalfHull([...sortedPoints].reverse())

  return [...lowerHull.slice(0, -1), ...upperHull.slice(0, -1)]
}

// 鉛筆位置に対する「ピンと張った輪」の周長と、直接張る 2 本の釘。
export const loopInfo = (
  nails: Point[],
  pencil: Point
): { perimeter: number; foci: number[] } => {
  const hull = convexHull([
    { ...nails[0], tag: 0 },
    { ...nails[1], tag: 1 },
    { ...nails[2], tag: 2 },
    { ...pencil, tag: 3 },
  ])
  const perimeter = hull.reduce(
    (total, point, index) =>
      total + distance(point, hull[(index + 1) % hull.length]),
    0
  )
  const pencilIndex = hull.findIndex((point) => point.tag === 3)
  const foci =
    pencilIndex < 0
      ? []
      : [
          hull[(pencilIndex - 1 + hull.length) % hull.length].tag,
          hull[(pencilIndex + 1) % hull.length].tag,
        ].filter((tag) => tag !== 3)

  return { perimeter, foci }
}

const arcKey = (foci: number[]): ArcKey => {
  if (foci.length !== 2) return 'ab'
  const pair = [...foci].sort().join('')

  if (pair === '01') return 'ab'
  if (pair === '12') return 'bc'
  return 'ca'
}

export const trianglePerimeter = (nails: Point[]): number =>
  distance(nails[0], nails[1]) +
  distance(nails[1], nails[2]) +
  distance(nails[2], nails[0])

const centroid = (nails: Point[]): Point => ({
  x: (nails[0].x + nails[1].x + nails[2].x) / 3,
  y: (nails[0].y + nails[1].y + nails[2].y) / 3,
})

const findCurvePoint = (
  nails: Point[],
  center: Point,
  loopLength: number,
  maxRadius: number,
  angle: number
): CurvePoint => {
  const direction = { x: Math.cos(angle), y: Math.sin(angle) }
  let lowerRadius = 0
  let upperRadius = maxRadius

  for (let iteration = 0; iteration < SEARCH_ITERATIONS; iteration++) {
    const radius = (lowerRadius + upperRadius) / 2
    const pencil = {
      x: center.x + direction.x * radius,
      y: center.y + direction.y * radius,
    }

    if (loopInfo(nails, pencil).perimeter < loopLength) lowerRadius = radius
    else upperRadius = radius
  }

  const radius = (lowerRadius + upperRadius) / 2
  const point = {
    x: center.x + direction.x * radius,
    y: center.y + direction.y * radius,
  }

  return { ...point, arc: arcKey(loopInfo(nails, point).foci) }
}

// 各方向で輪の全長が一定になる鉛筆位置を二分探索する。
export const computeCurve = (nails: Point[], slack: number): Curve => {
  const center = centroid(nails)
  const perimeter = trianglePerimeter(nails)
  const loopLength = perimeter + slack
  const maxRadius =
    Math.max(...nails.map((nail) => distance(center, nail))) + loopLength + 20
  const points = Array.from({ length: CURVE_POINT_COUNT }, (_, index) =>
    findCurvePoint(
      nails,
      center,
      loopLength,
      maxRadius,
      (TAU * index) / CURVE_POINT_COUNT
    )
  )

  return { points, trianglePerimeter: perimeter, loopLength }
}
