import _, { fill, random, range, sample } from 'lodash'
import { useMemo } from 'react'
import {
  Circle,
  ClockHand,
  Cross,
  Donut,
  DraftFan,
  Fan,
  PadCircle,
  Rect,
  ShineCircle,
  SmallRect,
} from './Shape'

type Props = {
  depthLimit: number
  w: number
  force?: Partial<ShapeItem>
}

const shapes = [
  'circle',
  'fan',
  'draftFan',
  'rect',
  'smallRect',
  'donut',
  'padCircle',
  'shineCircle',
  'clockHand',
  'cross',
] as const

const animes = ['spin', 'stay', 'move'] as const

type Shape = typeof shapes[number]
type Anime = typeof animes[number]
type ChildPos = 't' | 'b' | 'l' | 'r' | 'c' | 'it' | 'id' | 'il' | 'ir'
type Pos = { sx: number; sy: number }
const positions: Record<ChildPos, Pos> = {
  t: { sx: 0, sy: -1 },
  b: { sx: 0, sy: 1 },
  l: { sx: -1, sy: 0 },
  r: { sx: 1, sy: 0 },
  it: { sx: 0, sy: -0.5 },
  id: { sx: 0, sy: 0.5 },
  il: { sx: -0.5, sy: 0 },
  ir: { sx: 0.5, sy: 0 },
  c: { sx: 0, sy: 0 },
} as const

type RateSet = { shapes: Shape[]; animes: Anime[] }
type RateMap = { shape: Record<Shape, number>; anime: Record<Anime, number> }
const randomRates: Record<number, RateMap> = {
  1: {
    shape: {
      circle: 5,
      fan: 0,
      draftFan: 0,
      rect: 5,
      smallRect: 5,
      donut: 0,
      padCircle: 0,
      shineCircle: 1,
      clockHand: 1,
      cross: 1,
    },
    anime: { spin: 1, stay: 1, move: 0 },
  },
  2: {
    shape: {
      circle: 1,
      fan: 1,
      draftFan: 1,
      rect: 1,
      smallRect: 1,
      donut: 1,
      padCircle: 1,
      shineCircle: 0,
      clockHand: 1,
      cross: 1,
    },
    anime: { spin: 1, stay: 1, move: 1 },
  },
  3: {
    shape: {
      circle: 1,
      fan: 1,
      draftFan: 2,
      rect: 1,
      smallRect: 1,
      donut: 1,
      padCircle: 1,
      shineCircle: 0,
      clockHand: 1,
      cross: 1,
    },
    anime: { spin: 0, stay: 1, move: 0 },
  },
}

type ShapeItem = {
  pos: Pos
  shape: Shape
  anime: Anime
  animeOpt: number
  childNum: number
  deg: number
}

const convertRatesToSet = (rate: RateMap) => {
  return {
    shapes: shapes.reduce(
      (acc, k) => [...acc, ...fill(range(rate.shape[k]), k)],
      [] as Shape[]
    ),
    animes: animes.reduce(
      (acc, k) => [...acc, ...fill(range(rate.anime[k]), k)],
      [] as Anime[]
    ),
  }
}
const randomRatesSets = Object.entries(randomRates).reduce(
  (acc, [k, v]) => ({ ...acc, [k]: convertRatesToSet(v) }),
  {} as Record<number, RateSet>
)

const RandomShapeTree = ({ force, depthLimit, w }: Props) => {
  const item: ShapeItem = useMemo(() => {
    const rates = randomRatesSets[Math.max(1, Math.min(depthLimit, 3))]

    return {
      pos: sample(Object.values(positions)) || { sx: 0, sy: 0 },
      shape: sample(rates.shapes) || 'circle',
      anime: sample(rates.animes) || 'stay',
      animeOpt: random(4),
      childNum: random(depthLimit, depthLimit + 1),
      // deg: random(36) * 10,
      deg: random(8) * 45,
      ...force,
    }
  }, [force])

  if (depthLimit === 0) {
    return null
  }

  const wx = item.pos.sx * w
  const wy = item.pos.sy * w

  return (
    <svg x={wx} y={wy}>
      {/* <rect x={-w / 2} y={-w / 2} stroke="orange" width={w} height={w} /> */}
      <g
        className={item.anime}
        data-a-opt={item.animeOpt}
        style={{ transform: `rotate(${item.deg}deg)` }}
      >
        <RandomShapeDraw shape={item.shape} w={w} />
        {range(item.childNum).map((i) => (
          <RandomShapeTree key={i} w={w / 2} depthLimit={depthLimit - 1} />
        ))}
      </g>
    </svg>
  )
}

export const RandomShapeDraw = ({ shape, w }: { shape: Shape; w: number }) => {
  switch (shape) {
    case 'circle':
      return <Circle w={w} />
    case 'fan':
      return <Fan w={w} />
    case 'draftFan':
      return <DraftFan w={w} />
    case 'rect':
      return <Rect w={w} />
    case 'smallRect':
      return <SmallRect w={w} />
    case 'padCircle':
      return <PadCircle w={w} />
    case 'donut':
      return <Donut w={w} />
    case 'shineCircle':
      return <ShineCircle w={w} />
    case 'clockHand':
      return <ClockHand w={w} />
    case 'cross':
      return <Cross w={w} />
    default:
      return null
  }
}

export default RandomShapeTree
