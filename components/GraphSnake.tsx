import { Stage } from '@inlet/react-pixi'
import _ from 'lodash'
import * as React from 'react'
import { Line } from './PixiComponents'
import { useWidth } from './useWdith'
import { useGraphSnake } from './useSnakeGraph'

export type Candle = [
  [number, number, number, number, number],
  number,
  number,
  number
]
export type DataSet = {
  m5: Candle[]
  allo: { remaining: number }
}
type Props = {
  datasets: DataSet
}

export default function GraphSnake({ datasets }: Props) {
  const ref = React.useRef<HTMLDivElement>(null)
  const size = useWidth(ref)
  const { lines } = useGraphSnake(datasets, size)

  console.log(size)

  if (!size)
    return (
      <div style={{ width: '100vw', height: '80vh' }} ref={ref}>
        loading
      </div>
    )

  return (
    <div style={{ width: '100vw', height: '80vh' }} ref={ref}>
      <Stage
        width={size.width}
        height={size.height}
        options={{ resolution: 1 }}
      >
        {lines.map((l, i) => (
          <Line key={`ln-${i}`} {...l} />
        ))}
      </Stage>
      <p>
        {datasets.allo.remaining / 1000000} / {4000}
      </p>
    </div>
  )
}
