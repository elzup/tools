import { Stage } from '@inlet/react-pixi'
import _ from 'lodash'
import * as React from 'react'
import { Line, Rectangle } from './PixiComponents'
import { useWidth } from './useWdith'
import { useGraph, DataSet } from './useGraph'

type Props = {
  datasets: DataSet
}

export default function Graph({ datasets }: Props) {
  const ref = React.useRef<HTMLDivElement>(null)
  const size = useWidth(ref)
  const { h1s, lines } = useGraph(datasets, size)

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
        {h1s.map((rect, i) => (
          <Rectangle
            key={`h1-${i}`}
            x={rect.x}
            y={rect.y}
            width={rect.w || 4}
            height={rect.h || 4}
            color={0x290053}
          />
        ))}
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
