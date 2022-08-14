import { range } from '@elzup/kit'
import { randRange } from '@elzup/kit/lib/rand/randRange'
import {
  Box,
  FormControlLabel,
  Slider,
  Switch,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'
import { useInterval } from 'react-use'
import styled from 'styled-components'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const title = 'Dynamic Visual acuity 動体視力'

type Config = {
  n: number
  speedMs: number
  color: boolean
}
const initConfig: Config = {
  speedMs: 500,
  n: 3,
  color: false,
}

type Point = { x: number; y: number; v: number }
const RandInspect = () => {
  const [config, setConfig] = useState<Config>(initConfig)
  const { speedMs, n, color } = config
  const [markers, setMarkers] = useState<Point[]>([])

  const toggleColor = () => setConfig((v) => ({ ...v, color: !v.color }))
  const setSpeedMs = (speedMs: number) => setConfig((v) => ({ ...v, speedMs }))
  const setN = (n: number) => setConfig((v) => ({ ...v, n }))

  useInterval(() => {
    setMarkers(
      range(n).map(() => ({
        x: Math.random(),
        y: Math.random(),
        v: randRange(1, 9),
      }))
    )
  }, speedMs)

  return (
    <Layout title={title}>
      <Style>
        <Title>{title}</Title>
        <div style={{ display: 'flex' }}>
          <FormControlLabel
            control={<Switch onClick={toggleColor} />}
            label="色"
            labelPlacement="end"
            checked={color}
          />
          <Box style={{ width: 200 }}>
            <Typography>speed(ms)</Typography>
            <Slider
              defaultValue={speedMs}
              valueLabelDisplay="auto"
              onChangeCommitted={(e, v) => setSpeedMs(Number(v))}
              step={100}
              marks
              min={200}
              max={1000}
            />
          </Box>
          <Box style={{ width: 200 }}>
            <Typography>num</Typography>
            <Slider
              defaultValue={n}
              valueLabelDisplay="auto"
              onChangeCommitted={(e, v) => setN(Number(v))}
              marks
              min={1}
              max={5}
            />
          </Box>
        </div>
        <div>
          <div id="screen">
            {markers.map((m, i) => (
              <div
                key={i}
                className="point"
                style={{ top: `${m.y * 100}%`, left: `${m.x * 100}%` }}
              >
                {m.v}
              </div>
            ))}
          </div>
        </div>
      </Style>
    </Layout>
  )
}

const Style = styled.div`
  #screen {
    width: 100%;
    background: #000;
    height: 90vh;
    position: relative;

    .point {
      position: absolute;
      background: white;
      border-radius: 100px;
      width: 40px;
      height: 40px;
      text-align: center;
      line-height: 40px;
      color: black;
      font-weight: bold;
    }
  }
`

export default RandInspect
