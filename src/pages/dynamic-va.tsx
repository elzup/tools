import { range } from '@elzup/kit'
import { randGen } from '@elzup/kit/lib/rand'
import { FormControlLabel, Switch } from '@mui/material'
import * as React from 'react'
import { useInterval } from 'react-use'
import styled from 'styled-components'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const title = 'Dynamic Visual acuity 動体視力'

const randBasic = Math.random
const makeRand = () => {
  const r = randGen()
}
const randOrigin = makeRand()
const funcs = [randBasic, randOrigin]

type Config = {
  n: number
  speedMs: number
}

type Pos = { x: number; y: number }
const RandInspect = () => {
  const [{ speedMs, n }, setConfig] = React.useState<Config>({
    speedMs: 1000,
    n: 2,
  })
  const [markers, setMarkers] = React.useState<Pos[]>([])

  useInterval(() => {
    setMarkers(range(n).map((i) => ({ x: Math.random(), y: Math.random() })))
  }, speedMs)

  return (
    <Layout title={title}>
      <Style>
        <Title>{title}</Title>
        <div>
          {/* <FormControlLabel
          control={<Switch onClick={() => setComp(!comp)}></Switch>}
          label="ソート"
          labelPlacement="end"
          checked={comp}
        /> */}
        </div>
        <div>
          <div id="screen">
            {markers.map((m, i) => (
              <div
                key={i}
                className="point"
                style={{ top: `${m.y * 100}%`, left: `${m.x * 100}%` }}
              >
                a
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
    background: #ddd;
    aspect-ratio: 1;
    position: relative;

    .point {
      position: absolute;
    }
  }
`

export default RandInspect
