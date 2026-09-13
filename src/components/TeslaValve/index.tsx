import {
  Button,
  FormControlLabel,
  Slider,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import {
  DEFAULT_PARAMS,
  type Geometry,
  type ValveParams,
  buildGeometry,
} from './geometry'
import {
  type Lattice,
  advance,
  createLattice,
  flux,
  isBroken,
  reynolds,
} from './lbm'
import {
  type Tracers,
  type ViewMode,
  advectTracers,
  createImage,
  createTracers,
  drawTracers,
  paintField,
} from './render'

type Config = {
  units: number
  viscosity: number
  targetU: number // 目標の断面平均流速。体積力はここから逆算する
  substeps: number
  view: ViewMode
  tracers: boolean
  loops: boolean
}

const DEFAULT_CONFIG: Config = {
  units: 4,
  viscosity: 0.008,
  targetU: 0.06,
  substeps: 8,
  view: 'speed',
  tracers: true,
  loops: true,
}

const TRACER_COUNT = 240
const CANVAS_TARGET_WIDTH = 760

type Sim = {
  geo: Geometry
  forward: Lattice
  reverse: Lattice
  image: ImageData
  scratch: Float32Array
  tracersForward: Tracers
  tracersReverse: Tracers
  buffer: HTMLCanvasElement
  scale: number
}

const paramsOf = (config: Config): ValveParams => ({
  ...DEFAULT_PARAMS,
  units: config.units,
  loops: config.loops,
})

// 平面ポアズイユ流の関係 u = g h²/(3ν) から、目標流速を出す体積力へ逆算する。
// 力を直接いじらせると粘性を変えるたびに流速が動いて、整流比の比較条件が崩れる
const forceOf = (config: Config, params: ValveParams): number =>
  (3 * config.viscosity * config.targetU) /
  (params.channelHalf * params.channelHalf)

const buildSim = (config: Config): Sim => {
  const params = paramsOf(config)
  const geo = buildGeometry(params)
  const force = forceOf(config, params)
  const buffer = document.createElement('canvas')

  buffer.width = geo.nx
  buffer.height = geo.ny

  return {
    geo,
    forward: createLattice(geo, { viscosity: config.viscosity, force }),
    reverse: createLattice(geo, { viscosity: config.viscosity, force: -force }),
    image: createImage(geo),
    scratch: new Float32Array(geo.nx * geo.ny),
    tracersForward: createTracers(geo, TRACER_COUNT),
    tracersReverse: createTracers(geo, TRACER_COUNT),
    buffer,
    scale: Math.max(2, Math.min(6, Math.round(CANVAS_TARGET_WIDTH / geo.nx))),
  }
}

const draw = (
  sim: Sim,
  canvas: HTMLCanvasElement | null,
  lattice: Lattice,
  tracers: Tracers,
  config: Config
) => {
  const ctx = canvas?.getContext('2d')
  const bufferCtx = sim.buffer.getContext('2d')

  if (!ctx || !bufferCtx) return

  paintField(lattice, config.view, sim.image, sim.scratch)
  bufferCtx.putImageData(sim.image, 0, 0)
  ctx.imageSmoothingEnabled = false // 格子をぼかさない。壁の輪郭が甘くなると流路が読めない
  ctx.drawImage(
    sim.buffer,
    0,
    0,
    sim.buffer.width * sim.scale,
    sim.buffer.height * sim.scale
  )
  if (config.tracers) drawTracers(ctx, tracers, sim.scale)
}

type Stats = { qf: number; qr: number; steps: number }

const TeslaValve = () => {
  const forwardCanvas = useRef<HTMLCanvasElement>(null)
  const reverseCanvas = useRef<HTMLCanvasElement>(null)
  const simRef = useRef<Sim | null>(null)
  const configRef = useRef<Config>(DEFAULT_CONFIG)
  const runningRef = useRef(true)

  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [running, setRunning] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const [stats, setStats] = useState<Stats>({ qf: 0, qr: 0, steps: 0 })

  configRef.current = config
  runningRef.current = running

  const update = <K extends keyof Config>(key: K, value: Config[K]) =>
    setConfig((prev) => ({ ...prev, [key]: value }))

  // 形状 (段数・ループ有無) が変わったときだけ場を作り直す。
  // 粘性と流速はアニメーションループ側で毎フレーム反映するので再構築しない
  useEffect(() => {
    const sim = buildSim(configRef.current)

    simRef.current = sim
    for (const canvas of [forwardCanvas.current, reverseCanvas.current]) {
      if (!canvas) continue
      canvas.width = sim.geo.nx * sim.scale
      canvas.height = sim.geo.ny * sim.scale
    }
  }, [config.units, config.loops, resetKey])

  useEffect(() => {
    let handle = 0
    let lastStatAt = 0
    const tick = () => {
      handle = requestAnimationFrame(tick)

      const sim = simRef.current

      if (!sim) return

      const cfg = configRef.current
      const force = forceOf(cfg, sim.geo.params)

      sim.forward.drive = { viscosity: cfg.viscosity, force }
      sim.reverse.drive = { viscosity: cfg.viscosity, force: -force }

      if (runningRef.current) {
        advance(sim.forward, cfg.substeps)
        advance(sim.reverse, cfg.substeps)
        // 表示上の時間と計算上の時間を合わせる (1 サブステップ = 1 格子時間)
        advectTracers(sim.tracersForward, sim.forward, cfg.substeps)
        advectTracers(sim.tracersReverse, sim.reverse, cfg.substeps)
      }

      draw(sim, forwardCanvas.current, sim.forward, sim.tracersForward, cfg)
      draw(sim, reverseCanvas.current, sim.reverse, sim.tracersReverse, cfg)

      const now = performance.now()

      if (now - lastStatAt < 250) return
      lastStatAt = now

      if (isBroken(sim.forward) || isBroken(sim.reverse)) {
        // 粘性を下げすぎると格子ボルツマン法は発散する。黙って NaN を描き続けないよう作り直す
        setResetKey((key) => key + 1)
        return
      }
      setStats({
        qf: flux(sim.forward),
        qr: -flux(sim.reverse),
        steps: sim.forward.steps,
      })
    }

    handle = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(handle)
  }, [])

  const diodicity = stats.qr > 1e-6 ? stats.qf / stats.qr : Number.NaN
  const re = simRef.current
    ? reynolds(simRef.current.forward, config.targetU)
    : 0
  const settling = stats.steps < 3000

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Tesla の弁状導管 (valvular conduit, US1329559) を D2Q9
        格子ボルツマン法で解く。同じ流路・同じ駆動力で、 押す向きだけを逆にした
        2 本を並べて回している。可動部はひとつも無いのに、 逆向き (下)
        だけループへ吸い込まれた流れが噴き出して本流に正面衝突し、流量が落ちる。
      </Typography>

      <div>
        <ViewLabel>
          <strong>順方向</strong> — ループの入口が背を向けるので素通りする
        </ViewLabel>
        <Canvas ref={forwardCanvas} />
        <ViewLabel>
          <strong>逆方向</strong> — ループが流れを掴んで 180°
          反転させ、本流へ叩き返す
        </ViewLabel>
        <Canvas ref={reverseCanvas} />
      </div>

      <Stack spacing={0.5}>
        <Bar>
          <BarLabel>順 Q</BarLabel>
          <BarTrack>
            <BarFill $ratio={Math.min(1, stats.qf / 1.2)} $forward />
          </BarTrack>
          <BarValue>{stats.qf.toFixed(3)}</BarValue>
        </Bar>
        <Bar>
          <BarLabel>逆 Q</BarLabel>
          <BarTrack>
            <BarFill $ratio={Math.min(1, stats.qr / 1.2)} />
          </BarTrack>
          <BarValue>{stats.qr.toFixed(3)}</BarValue>
        </Bar>
        <Typography variant="body2">
          整流比 D = Q<sub>順</sub>/Q<sub>逆</sub> =
          <Diodicity>
            {' '}
            {Number.isFinite(diodicity) ? diodicity.toFixed(3) : '—'}{' '}
          </Diodicity>
          / Re ≈ {Math.round(re)} / {stats.steps} step
          {settling && <Settling>（収束中）</Settling>}
        </Typography>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
        useFlexGap
        alignItems="center"
      >
        <ToggleButtonGroup
          size="small"
          exclusive
          value={config.view}
          onChange={(_, view: ViewMode | null) => view && update('view', view)}
        >
          <ToggleButton value="speed">速さ</ToggleButton>
          <ToggleButton value="vorticity">渦度</ToggleButton>
          <ToggleButton value="pressure">圧力</ToggleButton>
        </ToggleButtonGroup>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setRunning((v) => !v)}
        >
          {running ? '一時停止' : '再開'}
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setResetKey((key) => key + 1)}
        >
          リセット
        </Button>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={config.tracers}
              onChange={(e) => update('tracers', e.target.checked)}
            />
          }
          label="トレーサー"
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={!config.loops}
              onChange={(e) => update('loops', !e.target.checked)}
            />
          }
          label="ループ無し (D≒1 の確認)"
        />
      </Stack>

      <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
        <Field>
          <Typography variant="caption">段数 {config.units}</Typography>
          <Slider
            size="small"
            min={2}
            max={6}
            step={2}
            marks
            value={config.units}
            onChange={(_, v) => update('units', v as number)}
          />
        </Field>
        <Field>
          <Typography variant="caption">
            動粘性 ν {config.viscosity.toFixed(3)}
          </Typography>
          <Slider
            size="small"
            min={0.005}
            max={0.03}
            step={0.001}
            value={config.viscosity}
            onChange={(_, v) => update('viscosity', v as number)}
          />
        </Field>
        <Field>
          <Typography variant="caption">
            目標流速 {config.targetU.toFixed(3)}
          </Typography>
          <Slider
            size="small"
            min={0.02}
            max={0.08}
            step={0.005}
            value={config.targetU}
            onChange={(_, v) => update('targetU', v as number)}
          />
        </Field>
        <Field>
          <Typography variant="caption">
            計算速度 {config.substeps} step/frame
          </Typography>
          <Slider
            size="small"
            min={1}
            max={16}
            step={1}
            value={config.substeps}
            onChange={(_, v) => update('substeps', v as number)}
          />
        </Field>
      </Stack>

      <Typography variant="caption" color="text.secondary">
        速さ表示は暗青 (遅い) → 赤 (速い)、渦度と圧力は青 ↔ 赤 の発散配色。
        単位はすべて格子単位。Re
        を上げるほど整流比は伸びるが、粘性を下げすぎると解が発散するので
        自動でリセットする。
      </Typography>
    </Stack>
  )
}

const Canvas = styled.canvas`
  width: 100%;
  height: auto;
  display: block;
  border-radius: 4px;
  background: #1c202a;
  image-rendering: pixelated;
`

const ViewLabel = styled(Typography).attrs({ variant: 'caption' })`
  display: block;
  margin: 6px 0 2px;
`

const Field = styled.div`
  width: 200px;
  flex: 1 1 160px;
`

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const BarLabel = styled.span`
  font-size: 12px;
  width: 3.5em;
`

const BarTrack = styled.div`
  flex: 1;
  height: 10px;
  background: #e0e3e8;
  border-radius: 5px;
  overflow: hidden;
`

const BarFill = styled.div<{ $ratio: number; $forward?: boolean }>`
  width: ${({ $ratio }) => Math.max(0, $ratio) * 100}%;
  height: 100%;
  background: ${({ $forward }) => ($forward ? '#2e9e64' : '#d1584f')};
  transition: width 0.2s linear;
`

const BarValue = styled.span`
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  width: 4em;
  text-align: right;
`

const Diodicity = styled.strong`
  font-size: 1.15em;
`

const Settling = styled.span`
  color: #b26a00;
`

export default TeslaValve
