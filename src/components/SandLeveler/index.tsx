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
import Surface3D from './Surface3D'
import {
  BLADE_INNER,
  type BladeState,
  GRID,
  RADIUS,
  type SandField,
  addMound,
  addRandomDents,
  advanceBlade,
  createBlade,
  createField,
  relaxSlopes,
  roughness,
} from './field'
import { shadeCell } from './shading'

const VIEW = 560
const MAX_FRAME_SEC = 0.05
const DIG_PER_SEC = 3.2

type DigMode = 'dig' | 'mound'
type ViewMode = '2d' | '3d'
type Pointer = { active: boolean; gx: number; gy: number }

const shadePixels = (field: SandField, data: Uint8ClampedArray) => {
  const rgb = [0, 0, 0]

  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const idx = y * GRID + x
      const o = idx * 4

      if (!field.inside[idx]) {
        data[o] = 26
        data[o + 1] = 29
        data[o + 2] = 38
        data[o + 3] = 255
        continue
      }
      shadeCell(field, x, y, rgb)
      data[o] = rgb[0]
      data[o + 1] = rgb[1]
      data[o + 2] = rgb[2]
      data[o + 3] = 255
    }
  }
}

const SandLeveler = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fieldRef = useRef<SandField | null>(null)
  const bladeRef = useRef<BladeState>(createBlade())
  const pointerRef = useRef<Pointer>({ active: false, gx: 0, gy: 0 })
  const spinRef = useRef(true)
  const speedRef = useRef(1.2)
  const brushRef = useRef(9)
  const modeRef = useRef<DigMode>('dig')
  const viewRef = useRef<ViewMode>('2d')
  const [isSpinning, setIsSpinning] = useState(true)
  const [speed, setSpeed] = useState(1.2)
  const [brush, setBrush] = useState(9)
  const [mode, setMode] = useState<DigMode>('dig')
  const [view, setView] = useState<ViewMode>('2d')
  const [rough, setRough] = useState(0)

  spinRef.current = isSpinning
  speedRef.current = speed
  brushRef.current = brush
  modeRef.current = mode
  viewRef.current = view

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) return
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    const field = createField()

    addRandomDents(field, 8)
    fieldRef.current = field

    const off = document.createElement('canvas')

    off.width = GRID
    off.height = GRID
    const offCtx = off.getContext('2d')

    if (!offCtx) return
    const image = offCtx.createImageData(GRID, GRID)

    let rafId = 0
    let prevTime = performance.now()
    let frameCount = 0

    const drawBlade = () => {
      const { angle, carry } = bladeRef.current
      const scale = VIEW / GRID
      const cx = VIEW / 2
      const cy = VIEW / 2
      const r0 = BLADE_INNER * scale
      const r1 = RADIUS * scale

      // バーが押している砂 (前方に溜まる波)
      ctx.fillStyle = '#e2cf9f'
      for (let bin = BLADE_INNER; bin <= RADIUS; bin++) {
        const amount = carry[bin]

        if (amount < 0.05) continue
        const ahead = angle + 3.5 / bin
        const px = cx + Math.cos(ahead) * bin * scale
        const py = cy + Math.sin(ahead) * bin * scale
        const size = Math.min(9, 1.2 + Math.sqrt(amount) * 1.6)

        ctx.beginPath()
        ctx.arc(px, py, size, 0, Math.PI * 2)
        ctx.fill()
      }

      // 残像
      for (let i = 3; i >= 1; i--) {
        const a = angle - i * 0.06 * Math.sign(speedRef.current)

        ctx.strokeStyle = `rgba(70, 60, 45, ${0.08 * (4 - i)})`
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0)
        ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1)
        ctx.stroke()
      }
      ctx.strokeStyle = '#4a4034'
      ctx.lineWidth = 6
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(angle) * r0, cy + Math.sin(angle) * r0)
      ctx.lineTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1)
      ctx.stroke()

      // 中心ハブ
      ctx.fillStyle = '#3a3228'
      ctx.beginPath()
      ctx.arc(cx, cy, r0 + 4, 0, Math.PI * 2)
      ctx.fill()
    }

    const loop = (now: number) => {
      const dt = Math.min((now - prevTime) / 1000, MAX_FRAME_SEC)

      prevTime = now

      const pointer = pointerRef.current

      if (pointer.active) {
        const depth = (modeRef.current === 'dig' ? -1 : 1) * DIG_PER_SEC * dt

        addMound(field, pointer.gx, pointer.gy, brushRef.current, depth)
      }

      if (spinRef.current) {
        bladeRef.current = advanceBlade(
          field,
          bladeRef.current,
          speedRef.current * dt
        )
      }
      relaxSlopes(field)

      if (viewRef.current === '2d') {
        shadePixels(field, image.data)
        offCtx.putImageData(image, 0, 0)
        ctx.imageSmoothingEnabled = true
        ctx.drawImage(off, 0, 0, VIEW, VIEW)

        // 皿の縁
        ctx.strokeStyle = '#565e70'
        ctx.lineWidth = 5
        ctx.beginPath()
        ctx.arc(VIEW / 2, VIEW / 2, (RADIUS * VIEW) / GRID + 2, 0, Math.PI * 2)
        ctx.stroke()

        drawBlade()
      }

      frameCount++
      if (frameCount % 20 === 0) setRough(roughness(field))
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    // 3D ビューはポインタキャプチャが効かないため、どこで離してもドラッグを解除する
    const clearPointer = () => {
      pointerRef.current = { ...pointerRef.current, active: false }
    }

    window.addEventListener('pointerup', clearPointer)
    window.addEventListener('pointercancel', clearPointer)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('pointerup', clearPointer)
      window.removeEventListener('pointercancel', clearPointer)
    }
  }, [])

  const pointerGrid = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()

    return {
      gx: Math.round(((e.clientX - rect.left) / rect.width) * GRID),
      gy: Math.round(((e.clientY - rect.top) / rect.height) * GRID),
    }
  }

  const handleDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointerRef.current = { active: true, ...pointerGrid(e) }
  }

  const handleMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointerRef.current.active) return
    pointerRef.current = { active: true, ...pointerGrid(e) }
  }

  const handleUp = () => {
    pointerRef.current = { ...pointerRef.current, active: false }
  }

  const resetFlat = () => {
    fieldRef.current?.height.fill(0)
    bladeRef.current.carry.fill(0)
  }

  const scatterDents = () => {
    if (fieldRef.current) addRandomDents(fieldRef.current, 8)
  }

  return (
    <Wrap>
      <Typography variant="body2" color="text.secondary">
        円形の皿の砂を、回転するブレードが整地するシミュレーション。バー面より上の砂はブレードが残さず持っていき、前方に波として溜まって一緒に周回しながら、くぼみを通るときに置いていかれます。3D
        表示では左ドラッグで掘る/盛る、右ドラッグで視点回転、ホイールでズームです。
      </Typography>
      <canvas
        ref={canvasRef}
        width={VIEW}
        height={VIEW}
        style={{ display: view === '2d' ? undefined : 'none' }}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
      />
      {view === '3d' && (
        <Surface3D
          fieldRef={fieldRef}
          bladeRef={bladeRef}
          pointerRef={pointerRef}
        />
      )}
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <FormControlLabel
          control={
            <Switch
              checked={isSpinning}
              onChange={(e) => setIsSpinning(e.target.checked)}
            />
          }
          label="回転"
        />
        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          onChange={(_, v: ViewMode | null) => {
            if (v !== null) setView(v)
          }}
        >
          <ToggleButton value="2d">2D</ToggleButton>
          <ToggleButton value="3d">3D</ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={mode}
          onChange={(_, v: DigMode | null) => {
            if (v !== null) setMode(v)
          }}
        >
          <ToggleButton value="dig">掘る</ToggleButton>
          <ToggleButton value="mound">盛る</ToggleButton>
        </ToggleButtonGroup>
        <Button variant="outlined" size="small" onClick={scatterDents}>
          ランダムくぼみ
        </Button>
        <Button variant="outlined" size="small" onClick={resetFlat}>
          リセット
        </Button>
        <Typography variant="body2" color="text.secondary">
          凹凸 RMS: {rough.toFixed(3)}
        </Typography>
      </Stack>
      <Stack spacing={0}>
        <Typography variant="caption">
          回転速度: {speed.toFixed(1)} rad/s
        </Typography>
        <Slider
          value={speed}
          min={0.2}
          max={4}
          step={0.1}
          onChange={(_, v) => setSpeed(v as number)}
        />
        <Typography variant="caption">ブラシ半径: {brush}</Typography>
        <Slider
          value={brush}
          min={4}
          max={18}
          step={1}
          onChange={(_, v) => setBrush(v as number)}
        />
      </Stack>
      <Typography variant="caption" color="text.secondary">
        高さ場 + 安息角の崩れ + 押し出しブレード
        (バー面より上の砂を全部ブレード前方へ押し流す)
        のモデル。砂の総量は保存されます。
      </Typography>
    </Wrap>
  )
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  canvas {
    width: 100%;
    max-width: ${VIEW}px;
    border-radius: 8px;
    touch-action: none;
    cursor: crosshair;
  }
`

export default SandLeveler
