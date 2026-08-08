import {
  Button,
  FormControlLabel,
  Slider,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import {
  PARAMS,
  type State,
  bodyPositions,
  computeLqrGain,
  rk4Step,
} from './physics'

const PHYS_DT = 1 / 240
const MAX_FRAME_SEC = 0.05
const FORCE_MAX = 60
const TRACK_HALF = 2.4
const TARGET_MAX = 0.9
const PX_PER_M = 160
const CANVAS_W = 860
const CANVAS_H = 420
const DRAG_SPRING = 30
// 二重倒立振り子の回復限界は先端持続力 ~1N しかないため、ここまで絞る
const DRAG_FORCE_MAX = 0.6
const FALLEN_COS = 0.15
const AUTO_RESET_SEC = 1.5

const LQR_Q = [8, 300, 300, 2, 30, 30]
const LQR_R = 0.2

const initialState = (): State => [
  0,
  (Math.random() - 0.5) * 0.06,
  (Math.random() - 0.5) * 0.06,
  0,
  0,
  0,
]

type Drag = { active: boolean; mx: number; my: number }

/** 画面座標 (px) ← 物理座標 (m)。y は上向き正 */
const toPx = (x: number, y: number) => ({
  px: CANVAS_W / 2 + x * PX_PER_M,
  py: CANVAS_H - 80 - y * PX_PER_M,
})

const toWorld = (px: number, py: number) => ({
  x: (px - CANVAS_W / 2) / PX_PER_M,
  y: (CANVAS_H - 80 - py) / PX_PER_M,
})

const isFallen = (s: State) =>
  Math.cos(s[1]) < FALLEN_COS || Math.cos(s[2]) < FALLEN_COS

const InvertedDoublePendulum = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stateRef = useRef<State>(initialState())
  const fallenAtRef = useRef<number | null>(null)
  const dragRef = useRef<Drag>({ active: false, mx: 0, my: 0 })
  const forceRef = useRef(0)
  const targetRef = useRef(0)
  const noiseRef = useRef(0)
  const controlRef = useRef(true)
  const [isControlOn, setIsControlOn] = useState(true)
  const [target, setTarget] = useState(0)
  const [noise, setNoise] = useState(0)
  const [fallen, setFallen] = useState(false)

  const gain = useMemo(() => computeLqrGain(LQR_Q, LQR_R), [])

  controlRef.current = isControlOn
  targetRef.current = target
  noiseRef.current = noise

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) return
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    let rafId = 0
    let prevTime = performance.now()
    let acc = 0

    const step = () => {
      const s = stateRef.current
      const drag = dragRef.current
      let fx = 0
      let fy = 0

      if (drag.active) {
        const { p2 } = bodyPositions(s)
        const rawFx = DRAG_SPRING * (drag.mx - p2.x)
        const rawFy = DRAG_SPRING * (drag.my - p2.y)
        const mag = Math.hypot(rawFx, rawFy)
        const scale = mag > DRAG_FORCE_MAX ? DRAG_FORCE_MAX / mag : 1

        fx = rawFx * scale
        fy = rawFy * scale
      }
      fx += (Math.random() - 0.5) * 2 * noiseRef.current * 1.5

      let u = 0

      if (controlRef.current) {
        const err = s.map((v, i) => (i === 0 ? v - targetRef.current : v))

        u = -gain.reduce((sum, k, i) => sum + k * err[i], 0)
        u = Math.max(-FORCE_MAX, Math.min(FORCE_MAX, u))
      }
      forceRef.current = u

      let next = rk4Step(s, u, PHYS_DT, fx, fy)

      if (!next.every(Number.isFinite)) {
        stateRef.current = initialState()
        return
      }
      if (Math.abs(next[0]) > TRACK_HALF) {
        next = next.map((v, i) => {
          if (i === 0) return Math.sign(v) * TRACK_HALF
          if (i === 3) return 0
          return v
        })
      }
      stateRef.current = next
    }

    const drawLink = (
      a: { x: number; y: number },
      b: { x: number; y: number }
    ) => {
      const pa = toPx(a.x, a.y)
      const pb = toPx(b.x, b.y)

      ctx.beginPath()
      ctx.moveTo(pa.px, pa.py)
      ctx.lineTo(pb.px, pb.py)
      ctx.stroke()
    }

    const draw = () => {
      const s = stateRef.current
      const { cart, p1, p2 } = bodyPositions(s)
      const u = forceRef.current

      ctx.fillStyle = '#10141c'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      // レールと壁
      const rail = toPx(0, 0)

      ctx.strokeStyle = '#3a4356'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(toPx(-TRACK_HALF - 0.1, 0).px, rail.py + 14)
      ctx.lineTo(toPx(TRACK_HALF + 0.1, 0).px, rail.py + 14)
      ctx.stroke()
      ctx.fillStyle = '#3a4356'
      const wallL = toPx(-TRACK_HALF - 0.1, 0)
      const wallR = toPx(TRACK_HALF + 0.1, 0)

      ctx.fillRect(wallL.px - 6, rail.py - 26, 6, 40)
      ctx.fillRect(wallR.px, rail.py - 26, 6, 40)

      // 目標位置マーカー
      const tg = toPx(targetRef.current, 0)

      ctx.fillStyle = '#4caf7d'
      ctx.beginPath()
      ctx.moveTo(tg.px, rail.py + 20)
      ctx.lineTo(tg.px - 7, rail.py + 32)
      ctx.lineTo(tg.px + 7, rail.py + 32)
      ctx.closePath()
      ctx.fill()

      // 制御力の矢印
      if (Math.abs(u) > 0.5) {
        const c = toPx(cart.x, 0)
        const len = (u / FORCE_MAX) * 70

        ctx.strokeStyle = '#e8a33d'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(c.px, rail.py + 40)
        ctx.lineTo(c.px + len, rail.py + 40)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(c.px + len + Math.sign(len) * 8, rail.py + 40)
        ctx.lineTo(c.px + len, rail.py + 34)
        ctx.lineTo(c.px + len, rail.py + 46)
        ctx.closePath()
        ctx.fillStyle = '#e8a33d'
        ctx.fill()
      }

      // カート
      const c = toPx(cart.x, 0)

      ctx.fillStyle = '#5b8dd9'
      ctx.fillRect(c.px - 28, c.py - 12, 56, 26)
      ctx.fillStyle = '#2c3548'
      ctx.beginPath()
      ctx.arc(c.px - 16, c.py + 16, 7, 0, Math.PI * 2)
      ctx.arc(c.px + 16, c.py + 16, 7, 0, Math.PI * 2)
      ctx.fill()

      // リンクとオモリ
      ctx.strokeStyle = '#c7cede'
      ctx.lineWidth = 5
      drawLink(cart, p1)
      drawLink(p1, p2)
      const pp1 = toPx(p1.x, p1.y)
      const pp2 = toPx(p2.x, p2.y)

      ctx.fillStyle = '#d9695f'
      ctx.beginPath()
      ctx.arc(pp1.px, pp1.py, 11, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#e0b350'
      ctx.beginPath()
      ctx.arc(pp2.px, pp2.py, 11, 0, Math.PI * 2)
      ctx.fill()

      // ドラッグ中の糸
      const drag = dragRef.current

      if (drag.active) {
        const m = toPx(drag.mx, drag.my)

        ctx.strokeStyle = 'rgba(255,255,255,0.5)'
        ctx.lineWidth = 1.5
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(pp2.px, pp2.py)
        ctx.lineTo(m.px, m.py)
        ctx.stroke()
        ctx.setLineDash([])
      }

      ctx.fillStyle = '#8892a8'
      ctx.font = '13px monospace'
      const deg = (v: number) => ((v * 180) / Math.PI).toFixed(1)

      ctx.fillText(
        `θ1=${deg(s[1])}°  θ2=${deg(s[2])}°  u=${u.toFixed(1)}N`,
        16,
        24
      )
    }

    const loop = (now: number) => {
      const frame = Math.min((now - prevTime) / 1000, MAX_FRAME_SEC)

      prevTime = now
      acc += frame
      while (acc >= PHYS_DT) {
        step()
        acc -= PHYS_DT
      }
      const s = stateRef.current
      const fallenNow = isFallen(s)
      // 振り回し中に瞬間的に直立向きを通過してもタイマーを解除しないよう、
      // 「静かに直立へ戻った」ときだけ回復と判定する
      const recovered =
        Math.cos(s[1]) > 0.95 &&
        Math.cos(s[2]) > 0.95 &&
        Math.abs(s[4]) < 1 &&
        Math.abs(s[5]) < 1

      if (!controlRef.current) {
        fallenAtRef.current = null
      } else if (fallenNow && fallenAtRef.current === null) {
        fallenAtRef.current = now
      } else if (fallenAtRef.current !== null) {
        if (recovered) {
          fallenAtRef.current = null
        } else if (now - fallenAtRef.current > AUTO_RESET_SEC * 1000) {
          stateRef.current = initialState()
          fallenAtRef.current = null
        }
      }
      setFallen(fallenNow || fallenAtRef.current !== null)
      draw()
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [gain])

  const pointerWorld = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * CANVAS_W
    const py = ((e.clientY - rect.top) / rect.height) * CANVAS_H

    return toWorld(px, py)
  }

  const handleDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const { x, y } = pointerWorld(e)

    dragRef.current = { active: true, mx: x, my: y }
  }

  const handleMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return
    const { x, y } = pointerWorld(e)

    dragRef.current = { active: true, mx: x, my: y }
  }

  const handleUp = () => {
    dragRef.current = { ...dragRef.current, active: false }
  }

  const reset = () => {
    stateRef.current = initialState()
  }

  const poke = () => {
    const s = stateRef.current
    const kick = (Math.random() < 0.5 ? -1 : 1) * (0.7 + Math.random() * 0.2)

    stateRef.current = s.map((v, i) => (i === 5 ? v + kick : v))
  }

  return (
    <Wrap>
      <Typography variant="body2" color="text.secondary">
        カート (支点) を左右に動かして二重振り子を直立に保つ LQR
        制御のシミュレーション。先端のオモリはドラッグでそっと引っ張れます
        (二重倒立振り子の回復限界はとても狭いので、外乱はごく弱くしてあります)。倒れたら少し待つと自動リセットします。
      </Typography>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
      />
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <FormControlLabel
          control={
            <Switch
              checked={isControlOn}
              onChange={(e) => setIsControlOn(e.target.checked)}
            />
          }
          label="制御 ON"
        />
        <Button variant="outlined" size="small" onClick={reset}>
          リセット
        </Button>
        <Button variant="outlined" size="small" onClick={poke}>
          小突く
        </Button>
        <Typography
          variant="body2"
          color={fallen ? 'error' : 'success.main'}
          sx={{ minWidth: 64 }}
        >
          {fallen ? '転倒中' : '安定'}
        </Typography>
      </Stack>
      <Stack spacing={0}>
        <Typography variant="caption">
          目標位置: {target.toFixed(2)} m
        </Typography>
        <Slider
          value={target}
          min={-TARGET_MAX}
          max={TARGET_MAX}
          step={0.05}
          onChange={(_, v) => setTarget(v as number)}
        />
        <Typography variant="caption">
          外乱ノイズ: {noise.toFixed(2)}
        </Typography>
        <Slider
          value={noise}
          min={0}
          max={1}
          step={0.05}
          onChange={(_, v) => setNoise(v as number)}
        />
      </Stack>
      <Typography variant="caption" color="text.secondary">
        質量: カート {PARAMS.cartMass}kg / オモリ {PARAMS.mass1}kg ×2, リンク長{' '}
        {PARAMS.len1}m ×2。直立平衡点まわりで線形化し、Riccati
        反復で求めた状態フィードバックゲインを使用。
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
    max-width: ${CANVAS_W}px;
    border-radius: 8px;
    touch-action: none;
    cursor: grab;
  }
`

export default InvertedDoublePendulum
