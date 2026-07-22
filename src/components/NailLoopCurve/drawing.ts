import { type ArcKey, type Curve, type Point, convexHull } from './geometry'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './config'

const TAU = Math.PI * 2
const GRID_SIZE = 28

const COLORS = {
  background: '#1a2733',
  grid: 'rgba(120,150,170,0.12)',
  fill: 'rgba(41,182,246,0.14)',
  curve: '#29b6f6',
  triangle: 'rgba(180,200,215,0.42)',
  nail: '#eceff4',
  nailDot: '#1a2733',
  string: 'rgba(255,255,255,0.6)',
  arc: {
    ab: '#29b6f6',
    bc: '#ffb300',
    ca: '#b388ff',
  } satisfies Record<ArcKey, string>,
}

export type DrawFlags = {
  showTriangle: boolean
  colorArcs: boolean
  isDemoPlaying: boolean
}

const drawGrid = (context: CanvasRenderingContext2D): void => {
  context.strokeStyle = COLORS.grid
  context.lineWidth = 1
  context.beginPath()
  for (let x = GRID_SIZE; x < CANVAS_WIDTH; x += GRID_SIZE) {
    context.moveTo(x, 0)
    context.lineTo(x, CANVAS_HEIGHT)
  }
  for (let y = GRID_SIZE; y < CANVAS_HEIGHT; y += GRID_SIZE) {
    context.moveTo(0, y)
    context.lineTo(CANVAS_WIDTH, y)
  }
  context.stroke()
}

const traceCurve = (context: CanvasRenderingContext2D, curve: Curve): void => {
  context.beginPath()
  context.moveTo(curve.points[0].x, curve.points[0].y)
  curve.points.slice(1).forEach((point) => {
    context.lineTo(point.x, point.y)
  })
  context.closePath()
}

const drawTriangle = (
  context: CanvasRenderingContext2D,
  nails: Point[]
): void => {
  context.strokeStyle = COLORS.triangle
  context.lineWidth = 1.4
  context.setLineDash([5, 4])
  context.beginPath()
  context.moveTo(nails[0].x, nails[0].y)
  nails.slice(1).forEach((nail) => {
    context.lineTo(nail.x, nail.y)
  })
  context.closePath()
  context.stroke()
  context.setLineDash([])
}

const drawCurve = (
  context: CanvasRenderingContext2D,
  curve: Curve,
  shouldColorArcs: boolean
): void => {
  context.lineWidth = 3
  context.lineJoin = 'round'

  if (!shouldColorArcs) {
    traceCurve(context, curve)
    context.strokeStyle = COLORS.curve
    context.stroke()
    return
  }

  curve.points.forEach((point, index) => {
    const nextPoint = curve.points[(index + 1) % curve.points.length]

    context.beginPath()
    context.strokeStyle = COLORS.arc[point.arc]
    context.moveTo(point.x, point.y)
    context.lineTo(nextPoint.x, nextPoint.y)
    context.stroke()
  })
}

const drawDemo = (
  context: CanvasRenderingContext2D,
  nails: Point[],
  curve: Curve,
  demoIndex: number
): void => {
  const pencil = curve.points[demoIndex % curve.points.length]
  const hull = convexHull([
    { ...nails[0], tag: 0 },
    { ...nails[1], tag: 1 },
    { ...nails[2], tag: 2 },
    { ...pencil, tag: 3 },
  ])

  context.strokeStyle = COLORS.string
  context.lineWidth = 1.6
  context.setLineDash([4, 3])
  context.beginPath()
  context.moveTo(hull[0].x, hull[0].y)
  hull.slice(1).forEach((point) => {
    context.lineTo(point.x, point.y)
  })
  context.closePath()
  context.stroke()
  context.setLineDash([])

  context.fillStyle = COLORS.curve
  context.beginPath()
  context.arc(pencil.x, pencil.y, 5, 0, TAU)
  context.fill()
  context.strokeStyle = COLORS.background
  context.lineWidth = 2
  context.stroke()
}

const drawNails = (context: CanvasRenderingContext2D, nails: Point[]): void => {
  const labels = ['A', 'B', 'C']

  nails.forEach((nail, index) => {
    context.fillStyle = COLORS.nail
    context.beginPath()
    context.arc(nail.x, nail.y, 7, 0, TAU)
    context.fill()
    context.fillStyle = COLORS.nailDot
    context.beginPath()
    context.arc(nail.x, nail.y, 2.4, 0, TAU)
    context.fill()
    context.fillStyle = COLORS.nail
    context.font = "600 15px 'Helvetica Neue', Arial, sans-serif"
    context.fillText(labels[index], nail.x + 11, nail.y + 5)
  })
}

export const drawNailLoopCurve = (
  context: CanvasRenderingContext2D,
  nails: Point[],
  curve: Curve,
  flags: DrawFlags,
  demoIndex: number
): void => {
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  context.fillStyle = COLORS.background
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  drawGrid(context)

  traceCurve(context, curve)
  context.fillStyle = COLORS.fill
  context.fill()

  if (flags.showTriangle) drawTriangle(context, nails)
  drawCurve(context, curve, flags.colorArcs)
  if (flags.isDemoPlaying) drawDemo(context, nails, curve, demoIndex)
  drawNails(context, nails)
}
