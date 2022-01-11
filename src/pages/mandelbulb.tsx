import { TextField } from '@mui/material'
import React, { useState } from 'react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'
import { useMandelbulb } from '../components/useMandelbulb'
import { zoom2D } from '../utils'

type Rect = { sx: number; sy: number; ex: number; ey: number }
const zoomCenter = (zoom: Rect, px: number, py: number, scale = 2) => {
  const [sx, sy, ex, ey] = zoom2D(
    zoom.sx,
    zoom.sy,
    zoom.ex,
    zoom.ey,
    px,
    py,
    scale
  )

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
      <Title>{title}</Title>
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
        <TextField
          type="number"
          value={rep}
          inputProps={{ min: 1, max: 60 }}
          onChange={(e) => setRep(Number(e.target.value))}
        />
      </div>
      <div>
        size:{' '}
        <TextField
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
