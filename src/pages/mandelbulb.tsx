import React, { useState } from 'react'
import { Header, Input } from 'semantic-ui-react'
import Layout from '../components/Layout'
import { useMandelbulb } from '../components/useMandelbulb'

type Rect = { sx: number; sy: number; ex: number; ey: number }
const zoomCenter1D = (s: number, e: number, p: number, scale = 2) => {
  const d = e - s
  const o = s + d * p
  const r = d / scale / 2
  const ns = o - r
  const ne = o + r

  console.log({ ns, ne, o, d, r })
  return { ns, ne }
}
const zoomCenter = (prev: Rect, px: number, py: number, scale = 2) => {
  const { ns: sx, ne: ex } = zoomCenter1D(prev.sx, prev.ex, px, scale)
  const { ns: sy, ne: ey } = zoomCenter1D(prev.sy, prev.ey, py, scale)

  console.log({ sx, sy, ex, ey })
  return { sx, sy, ex, ey }
}

const initialZoom = { sx: -2, sy: -2, ex: 2, ey: 2 }

const title = 'マンデルブロ集合'

const wholeSize = 600

function MandelEditPage() {
  const [zoom, setZoom] = useState<Rect>(initialZoom)
  const [rep, setRep] = useState<number>(40)
  const [size, setSize] = useState<number>(600)
  const [png] = useMandelbulb(zoom, rep, size)

  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>
      <img
        src={png}
        alt="plot"
        style={{ width: `${wholeSize}px`, height: `${wholeSize}px` }}
        onMouseDown={({ nativeEvent: { offsetX, offsetY } }) => {
          const px = offsetX / wholeSize
          const py = offsetY / wholeSize

          setZoom(zoomCenter(zoom, px, py, 2))
        }}
      />
      <div>
        rep:{' '}
        <Input
          size="large"
          type="number"
          value={rep}
          inputProps={{ min: 1, max: 60 }}
          onChange={(e) => setRep(Number(e.target.value))}
        />
      </div>
      <div>
        size:{' '}
        <Input
          size="large"
          type="number"
          value={size}
          inputProps={{ min: 1, max: 1000 }}
          onChange={(e) => setSize(Number(e.target.value))}
        />
      </div>
    </Layout>
  )
}

export default MandelEditPage
