import { Button, Slider, Stack, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import MatrixEditor from './MatrixEditor'
import { COLOR_SCHEMES } from './palette'
import SchemePicker from './SchemePicker'
import StylePicker from './StylePicker'
import {
  createWorld,
  type Matrix,
  type Params,
  randomMatrix,
  snakeMatrix,
  step,
  symmetricMatrix,
  type World,
  zeroMatrix,
} from './particleLife'
import { createRenderer, type DrawStyle } from './render'

const SIZE = 640
// 実時間ではなく固定刻みで進める。タブ復帰時などに dt が跳ねると粒子が吹き飛ぶため
const SIM_DT = 0.02
// 種類数スライダーの上限。描き方の割り当てはこの数だけ持つ
const MAX_TYPES = 10

type Config = {
  typeCount: number
  count: number
  params: Params
}

const DEFAULT: Config = {
  typeCount: 6,
  count: 1500,
  params: { rMax: 0.1, frictionHalfLife: 0.04, forceFactor: 10 },
}

const ParticleLife = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [config, setConfig] = useState<Config>(DEFAULT)
  const [matrix, setMatrix] = useState<Matrix>(() =>
    randomMatrix(DEFAULT.typeCount)
  )
  const [running, setRunning] = useState(true)
  const [styles, setStyles] = useState<DrawStyle[]>(() =>
    Array(MAX_TYPES).fill('dots')
  )

  const worldRef = useRef<World>(createWorld(DEFAULT.count, DEFAULT.typeCount))
  const matrixRef = useRef(matrix)
  const configRef = useRef(config)
  const [schemeIndex, setSchemeIndex] = useState(0)
  const runningRef = useRef(running)
  const schemeRef = useRef(schemeIndex)
  const stylesRef = useRef(styles)

  matrixRef.current = matrix
  configRef.current = config
  runningRef.current = running
  stylesRef.current = styles
  schemeRef.current = schemeIndex

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')

    if (!ctx) return
    const renderer = createRenderer(ctx, SIZE)
    let raf = 0

    const loop = () => {
      const cfg = configRef.current

      if (runningRef.current) {
        step(worldRef.current, matrixRef.current, cfg.params, SIM_DT)
      }
      renderer.draw({
        world: worldRef.current,
        typeCount: cfg.typeCount,
        styles: stylesRef.current,
        rMax: cfg.params.rMax,
        scheme: COLOR_SCHEMES[schemeRef.current],
      })
      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const respawn = (count: number, typeCount: number) => {
    worldRef.current = createWorld(count, typeCount)
  }

  const changeTypeCount = (typeCount: number) => {
    setConfig({ ...config, typeCount })
    setMatrix(randomMatrix(typeCount))
    respawn(config.count, typeCount)
  }

  const changeCount = (count: number) => {
    setConfig({ ...config, count })
    respawn(count, config.typeCount)
  }

  const changeParams = (patch: Partial<Params>) =>
    setConfig({ ...config, params: { ...config.params, ...patch } })

  const n = config.typeCount
  const colorOf = COLOR_SCHEMES[schemeIndex].color

  return (
    <Wrap>
      <canvas ref={canvasRef} width={SIZE} height={SIZE} />

      <Side>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="contained"
            size="small"
            onClick={() => setMatrix(randomMatrix(n))}
          >
            ランダム
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setMatrix(symmetricMatrix(n))}
          >
            対称
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setMatrix(snakeMatrix(n))}
          >
            鎖
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setMatrix(zeroMatrix(n))}
          >
            全部 0
          </Button>
        </Stack>

        <MatrixEditor matrix={matrix} onChange={setMatrix} colorOf={colorOf} />

        <Typography variant="caption">描き方 (色ごと)</Typography>
        <StylePicker
          typeCount={n}
          styles={styles}
          onChange={setStyles}
          colorOf={colorOf}
        />

        <Typography variant="caption">配色</Typography>
        <SchemePicker
          value={schemeIndex}
          typeCount={n}
          onChange={setSchemeIndex}
        />

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => respawn(config.count, n)}
          >
            粒子を撒き直す
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setRunning((r) => !r)}
          >
            {running ? '一時停止' : '再開'}
          </Button>
        </Stack>

        <SliderRow>
          <Typography variant="caption">種類数</Typography>
          <Slider
            size="small"
            min={2}
            max={10}
            step={1}
            marks
            value={n}
            valueLabelDisplay="auto"
            onChange={(_, v) => changeTypeCount(v as number)}
          />
        </SliderRow>
        <SliderRow>
          <Typography variant="caption">粒子数</Typography>
          <Slider
            size="small"
            min={200}
            max={3000}
            step={100}
            value={config.count}
            valueLabelDisplay="auto"
            onChange={(_, v) => changeCount(v as number)}
          />
        </SliderRow>
        <SliderRow>
          <Typography variant="caption">相互作用距離 rMax</Typography>
          <Slider
            size="small"
            min={0.03}
            max={0.25}
            step={0.01}
            value={config.params.rMax}
            valueLabelDisplay="auto"
            onChange={(_, v) => changeParams({ rMax: v as number })}
          />
        </SliderRow>
        <SliderRow>
          <Typography variant="caption">摩擦 (速度の半減期 秒)</Typography>
          <Slider
            size="small"
            min={0.01}
            max={0.3}
            step={0.01}
            value={config.params.frictionHalfLife}
            valueLabelDisplay="auto"
            onChange={(_, v) => changeParams({ frictionHalfLife: v as number })}
          />
        </SliderRow>
        <SliderRow>
          <Typography variant="caption">力の強さ</Typography>
          <Slider
            size="small"
            min={1}
            max={30}
            step={1}
            value={config.params.forceFactor}
            valueLabelDisplay="auto"
            onChange={(_, v) => changeParams({ forceFactor: v as number })}
          />
        </SliderRow>

        <Note>
          色ごとに「どの色にどれだけ引かれるか」を表の値 (-1〜1)
          で決めるだけのシミュレーション。行が自分、列が相手で、
          <b>緑は引力・赤は斥力</b>。A→B と B→A が違ってよい (非対称)
          ため、追いかけっこや回転する細胞のような構造が生まれる。
          近づきすぎると色に関係なく反発する。セルをクリックで +0.25、
          右クリックで -0.25。
        </Note>
      </Side>
    </Wrap>
  )
}

const Wrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: flex-start;

  canvas {
    width: 100%;
    max-width: ${SIZE}px;
    aspect-ratio: 1;
    border-radius: 8px;
  }
`

const Side = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  min-width: 260px;
  max-width: 420px;
`

const SliderRow = styled.div`
  display: flex;
  flex-direction: column;
`

const Note = styled.p`
  font-size: 0.85rem;
  line-height: 1.7;
  color: #555;
`

export default ParticleLife
