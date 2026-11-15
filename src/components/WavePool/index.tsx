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
import { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { type Drive, type Vec, timeReversalDrive, uniformDrive } from './drive'
import { type ViewMode, createImage, drawOverlay, paintField } from './render'
import {
  type Pool,
  type Source,
  type Wall,
  advance,
  createPool,
  focusRatio,
  isBroken,
  omegaOf,
  placeSources,
  toCell,
  toUnit,
} from './sim'
import {
  CUSTOM_MAX,
  TARGET_LABELS,
  type TargetKind,
  buildTargets,
  clampToPool,
} from './targets'
import {
  type WaveformAlign,
  drawSideWaveforms,
  drawWaveforms,
} from './waveform'

type Config = {
  sources: number
  wavelength: number
  damping: number
  substeps: number
  wall: Wall
  view: ViewMode
  target: TargetKind
  phaseControl: boolean
}

const DEFAULT_CONFIG: Config = {
  sources: 64,
  wavelength: 16,
  damping: 0.004,
  substeps: 1,
  wall: 'absorb',
  view: 'height',
  target: 'point',
  phaseControl: true,
}

// 200 だと 1 フレーム 6 ステップで 24 万セル更新になり、ノート PC でも 60fps を保てる
const GRID = 200
const CANVAS_TARGET_WIDTH = 640
// 格子 1 セルを何 px で描くか。整数倍にして拡大のにじみを均一にする
const SCALE = Math.max(2, Math.round(CANVAS_TARGET_WIDTH / GRID))
// 焦点の評価半径。波長 16 セルの焦点幅 (≈ λ/2) に収まる大きさ
const FOCUS_REACH = 3
const STAT_INTERVAL_MS = 250
// 波形パネルの描画解像度 (CSS 幅は親に合わせて縮む)。行数 128 でも 1 行 2px 以上を確保する高さ
const WAVE_WIDTH = CANVAS_TARGET_WIDTH
const WAVE_HEIGHT = 300
// プール図の右に足す、右半分の造波機の波形欄 (描画 px)。プール 600px に対して 3 周期が読める幅
const SIDE_WIDTH = 300

const WALL_LABELS: Record<Wall, string> = {
  absorb: '吸収',
  free: '自由端',
  fixed: '固定端',
}

type Sim = {
  pool: Pool
  sources: Source[]
  image: ImageData
  buffer: HTMLCanvasElement
  scale: number
  peak: number
}

const buildSim = (config: Config): Sim => {
  const pool = createPool(GRID, config.wall, config.damping)
  const buffer = document.createElement('canvas')
  buffer.width = GRID
  buffer.height = GRID
  return {
    pool,
    sources: placeSources(pool, config.sources),
    image: createImage(GRID),
    buffer,
    scale: SCALE,
    peak: 0,
  }
}

const drivesOf = (sim: Sim, targetCells: Vec[], config: Config): Drive[] =>
  config.phaseControl
    ? timeReversalDrive(
        sim.sources.map((s) => s.pos),
        targetCells,
        omegaOf(config.wavelength)
      )
    : uniformDrive(sim.sources.length)

type WavePanelInput = {
  drives: Drive[]
  omega: number
  reference: Vec | null
  align: WaveformAlign
}

const draw = (
  sim: Sim,
  canvas: HTMLCanvasElement | null,
  targetCells: Vec[],
  view: ViewMode,
  wave: WavePanelInput
) => {
  const ctx = canvas?.getContext('2d')
  const bufferCtx = sim.buffer.getContext('2d')
  if (!ctx || !bufferCtx) return

  const poolPx = GRID * sim.scale
  sim.peak = paintField(sim.pool, view, sim.image, sim.peak)
  bufferCtx.putImageData(sim.image, 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(sim.buffer, 0, 0, poolPx, poolPx)
  ctx.clearRect(poolPx, 0, SIDE_WIDTH, poolPx)
  // 引き出し線がプールの上を通るので、造波機のドットより先に描いて下に敷く
  drawSideWaveforms(ctx, poolPx, SIDE_WIDTH, {
    ...wave,
    sources: sim.sources,
    time: sim.pool.time,
    centerX: sim.pool.center.x,
    scale: sim.scale,
  })
  drawOverlay(ctx, sim.pool, sim.sources, wave.drives, targetCells, sim.scale)
}

const drawWavePanel = (
  canvas: HTMLCanvasElement | null,
  sim: Sim,
  input: WavePanelInput
) => {
  const ctx = canvas?.getContext('2d')
  if (!ctx) return
  drawWaveforms(ctx, WAVE_WIDTH, WAVE_HEIGHT, {
    ...input,
    sources: sim.sources,
    time: sim.pool.time,
  })
}

type Stats = { focus: number; time: number }

const WavePool = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const simRef = useRef<Sim | null>(null)
  const configRef = useRef<Config>(DEFAULT_CONFIG)
  const runningRef = useRef(true)
  const targetsRef = useRef<Vec[]>([])
  const drivesRef = useRef<Drive[]>([])
  const waveRef = useRef<HTMLCanvasElement>(null)
  const alignRef = useRef<WaveformAlign>('emit')

  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [running, setRunning] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const [pointer, setPointer] = useState<Vec>({ x: 0.3, y: -0.2 })
  const [custom, setCustom] = useState<Vec[]>([])
  const [stats, setStats] = useState<Stats>({ focus: 0, time: 0 })
  const [align, setAlign] = useState<WaveformAlign>('emit')

  configRef.current = config
  runningRef.current = running
  alignRef.current = align

  const update = <K extends keyof Config>(key: K, value: Config[K]) =>
    setConfig((prev) => ({ ...prev, [key]: value }))

  const targetsUnit = useMemo(
    () => buildTargets(config.target, pointer, custom),
    [config.target, pointer, custom]
  )

  // 波源数・壁・減衰は格子の作り直しが要る。波長と位相は毎フレーム反映できるので含めない
  useEffect(() => {
    const sim = buildSim(configRef.current)
    simRef.current = sim
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = GRID * sim.scale + SIDE_WIDTH
    canvas.height = GRID * sim.scale
  }, [config.sources, config.wall, config.damping, resetKey])

  // 格子を作り直す effect より後に宣言して、同じコミットでは新しい格子の波源に対して計算させる
  useEffect(() => {
    const sim = simRef.current
    if (!sim) return
    const cells = targetsUnit.map((p) => toCell(sim.pool, p))
    targetsRef.current = cells
    drivesRef.current = drivesOf(sim, cells, config)
  }, [targetsUnit, config, resetKey])

  useEffect(() => {
    let handle = 0
    let lastStatAt = 0
    const tick = () => {
      handle = requestAnimationFrame(tick)
      const sim = simRef.current
      if (!sim) return
      const cfg = configRef.current
      if (drivesRef.current.length !== sim.sources.length) return
      if (runningRef.current) {
        advance(
          sim.pool,
          sim.sources,
          drivesRef.current,
          omegaOf(cfg.wavelength),
          cfg.substeps
        )
      }
      const wave: WavePanelInput = {
        drives: drivesRef.current,
        omega: omegaOf(cfg.wavelength),
        reference: targetsRef.current[0] ?? null,
        align: alignRef.current,
      }
      draw(sim, canvasRef.current, targetsRef.current, cfg.view, wave)
      drawWavePanel(waveRef.current, sim, wave)

      const now = performance.now()
      if (now - lastStatAt < STAT_INTERVAL_MS) return
      lastStatAt = now
      if (isBroken(sim.pool)) {
        // 陽解法なので理論上は発散しないが、万一 NaN になったら描き続けずに作り直す
        setResetKey((key) => key + 1)
        return
      }
      setStats({
        focus: focusRatio(sim.pool, targetsRef.current, FOCUS_REACH),
        time: sim.pool.time,
      })
    }
    handle = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(handle)
  }, [])

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const sim = simRef.current
    if (!sim) return
    const rect = e.currentTarget.getBoundingClientRect()
    // canvas はプール + 右の波形欄なので、横方向は全幅を格子セル換算してからプール部分だけ受け付ける
    const totalCells = GRID + SIDE_WIDTH / sim.scale
    const cell = {
      x: ((e.clientX - rect.left) / rect.width) * totalCells,
      y: ((e.clientY - rect.top) / rect.height) * GRID,
    }
    if (cell.x > GRID) return
    const p = clampToPool(toUnit(sim.pool, cell))
    if (config.target === 'custom') {
      setCustom((prev) => [...prev, p].slice(-CUSTOM_MAX))
      return
    }
    setPointer(p)
    if (config.target !== 'point') update('target', 'point')
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        円形プールの縁に造波機を等間隔に並べ、それぞれの振幅と位相を調整して
        水面の狙った場所に波を集める。位相は時間反転
        (位相共役)で決める。ターゲットから各造波機までの距離 r
        に対して、届いたとき山が揃うように φ = k·r を選び、複数ターゲットは
        e^(ikr)/√r の和の偏角と大きさを使う。
      </Typography>

      <PoolWrap>
        <Canvas ref={canvasRef} onClick={onCanvasClick} />
      </PoolWrap>

      <Typography variant="body2">
        集中度 (ターゲット周辺 / プール平均のエネルギー比):{' '}
        <strong>{stats.focus.toFixed(2)}</strong> / t = {Math.round(stats.time)}
        {stats.time < 400 && <Muted>（定常化中）</Muted>}
      </Typography>

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
          value={config.target}
          onChange={(_, v: TargetKind | null) => v && update('target', v)}
        >
          {(Object.keys(TARGET_LABELS) as TargetKind[]).map((kind) => (
            <ToggleButton key={kind} value={kind}>
              {TARGET_LABELS[kind]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {config.target === 'custom' && (
          <Button size="small" variant="outlined" onClick={() => setCustom([])}>
            点を消す ({custom.length}/{CUSTOM_MAX})
          </Button>
        )}
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
          onChange={(_, v: ViewMode | null) => v && update('view', v)}
        >
          <ToggleButton value="height">水面の高さ</ToggleButton>
          <ToggleButton value="energy">時間平均エネルギー</ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={config.wall}
          onChange={(_, v: Wall | null) => v && update('wall', v)}
        >
          {(Object.keys(WALL_LABELS) as Wall[]).map((w) => (
            <ToggleButton key={w} value={w}>
              壁: {WALL_LABELS[w]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={config.phaseControl}
              onChange={(e) => update('phaseControl', e.target.checked)}
            />
          }
          label="位相制御"
        />
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
          onClick={() => setResetKey((k) => k + 1)}
        >
          リセット
        </Button>
      </Stack>

      <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
        <Field>
          <Typography variant="caption">造波機 {config.sources} 台</Typography>
          <Slider
            size="small"
            min={8}
            max={128}
            step={8}
            value={config.sources}
            onChange={(_, v) => update('sources', v as number)}
          />
        </Field>
        <Field>
          <Typography variant="caption">
            波長 λ {config.wavelength} セル
          </Typography>
          <Slider
            size="small"
            min={8}
            max={40}
            step={1}
            value={config.wavelength}
            onChange={(_, v) => update('wavelength', v as number)}
          />
        </Field>
        <Field>
          <Typography variant="caption">
            減衰 γ {config.damping.toFixed(3)}
          </Typography>
          <Slider
            size="small"
            min={0}
            max={0.03}
            step={0.001}
            value={config.damping}
            onChange={(_, v) => update('damping', v as number)}
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
        水面をクリックすると 1 点ターゲットをそこへ動かす
        (自由配置モードでは点を足す)。
        縁のドットが造波機で、色が位相、大きさが振幅。白い輪がターゲット。右半分の造波機は、同じ高さの右側にその駆動波形を出す
        (左端が今、右へ流れて過去)。
        位相制御を切ると全台同位相になり、中心にしか集まらないことと比べられる。
        造波機の間隔が λ/2 より広いと、狙っていない場所にも焦点
        (グレーティングローブ) が出る。単位は格子単位 (c = 1)。
      </Typography>

      <Stack spacing={1}>
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          alignItems="center"
        >
          <Typography variant="subtitle2">造波機ごとの駆動波形</Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={align}
            onChange={(_, v: WaveformAlign | null) => v && setAlign(v)}
          >
            <ToggleButton value="emit">送出時</ToggleButton>
            <ToggleButton value="arrival">ターゲット到着時</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <CanvasWrap>
          <WaveCanvas ref={waveRef} width={WAVE_WIDTH} height={WAVE_HEIGHT} />
        </CanvasWrap>
        <Typography variant="caption" color="text.secondary">
          1 行が造波機 1 台 (縦軸は縁の角度、0° が右で画面上は時計回り)、
          横軸は時間で右端が今。線の色は位相、振れ幅は振幅。
          「ターゲット到着時」は各波形をターゲットまでの距離 r
          ぶん遅らせて並べ替えたもの。位相制御が効いていれば全行の山が縦一列に揃う
          (ターゲットが複数のときは最初の 1 点を基準にする)。
        </Typography>
      </Stack>
    </Stack>
  )
}

const CanvasWrap = styled.div`
  max-width: ${CANVAS_TARGET_WIDTH}px;
`

const Canvas = styled.canvas`
  width: 100%;
  height: auto;
  display: block;
  border-radius: 4px;
  background: #1c202a;
  cursor: crosshair;
`

// プール (GRID × SCALE px) + 波形欄。描画 px と CSS px を 1:1 にして線を滲ませない
const PoolWrap = styled.div`
  max-width: ${GRID * SCALE + SIDE_WIDTH}px;
`

const WaveCanvas = styled.canvas`
  width: 100%;
  height: auto;
  display: block;
  border-radius: 4px;
  background: #1c202a;
`

const Muted = styled.span`
  margin-left: 4px;
  opacity: 0.6;
`

const Field = styled.div`
  width: 200px;
  flex: 1 1 160px;
`

export default WavePool
