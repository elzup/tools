import { random, range, sample } from 'lodash'
import { useMemo } from 'react'
import { Circle, Fan, Props as ShapeProps, Rect, RectInCircle } from './Shape'

type Props = {
  depthLimit: number
  w: number
}

const shapes = ['circle', 'fan', 'rect', 'rectInCircle'] as const
const anims = ['spin', 'stay'] as const

type Shape = typeof shapes[number]
type Anime = typeof anims[number]
type ChildPos = 'top' | 'left' | 'right' | 'bottom' | 'center'
type Pos = { sx: number; sy: number }
const positions: Record<ChildPos, Pos> = {
  top: { sx: 0, sy: -1 },
  bottom: { sx: 0, sy: 1 },
  left: { sx: -1, sy: 0 },
  right: { sx: 1, sy: 0 },
  center: { sx: 0, sy: 0 },
} as const

type ShapeItem = {
  pos: Pos
  shape: Shape
  anime: Anime
  childNum: number
}

export const RandomShapeTree = ({ depthLimit, w }: Props) => {
  const item: ShapeItem = useMemo(() => {
    return {
      pos: sample(Object.values(positions)) || { sx: 0, sy: 0 },
      shape: sample(shapes) || 'circle',
      anime: sample(anims) || 'stay',
      childNum: random(1, 4),
    }
  }, [])

  if (depthLimit === 0) {
    return null
  }

  const wx = item.pos.sx * w
  const wy = item.pos.sy * w

  return (
    <svg x={wx} y={wy}>
      <rect x={-w / 2} y={-w / 2} stroke="orange" width={w} height={w} />
      <g className={item.anime}>
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
    case 'rect':
      return <Rect w={w} />
    case 'rectInCircle':
      return <RectInCircle w={w} />
    default:
      return null
  }
}
