import {
  Button,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import {
  advance,
  Ball,
  focusDistance,
  isInside,
  normalize,
  Vec,
} from './billiard'

const W = 760
const H = 480
const CX = W / 2
const CY = H / 2
const A = 340 // 半長軸 (横) は固定。短軸 B は扁平率で変える
const TAU = Math.PI * 2

const PALETTE = ['#ff5252', '#ffb300', '#42d77d', '#29b6f6', '#b388ff', '#ff80ab'] // prettier-ignore

type Mode = 'aim' | 'focus' | 'fan'

type Config = {
  ratioB: number // 短軸/長軸 (0.3〜0.95)。1 に近いほど円に近い
  speed: number // px/秒
  trail: number // 保持する反射点数 (軌跡の長さ)
  rays: number // プリセット発射の本数
  mode: Mode
}

const DEFAULT: Config = {
  ratioB: 0.6,
  speed: 360,
  trail: 80,
  rays: 24,
  mode: 'aim',
}

const semiB = (ratioB: number): number => A * ratioB

// 楕円ローカル座標 (中心原点) ↔ canvas 座標
const toCanvas = (p: Vec): Vec => ({ x: CX + p.x, y: CY + p.y })

const newBall = (p: Vec, dir: Vec, color: string): Ball => ({
  p,
  d: normalize(dir),
  color,
  vertices: [],
})

// 焦点 (−c,0) から扇状に rays 本発射。焦点を通る軌道は反対焦点へ集まる。
const focusRays = (count: number, b: number): Ball[] => {
  const c = focusDistance(A, b)
  const origin = { x: -c, y: 0 }

  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * (i + 0.5)) / count - Math.PI / 2 // 右半面へ扇形
    const dir = { x: Math.cos(angle), y: Math.sin(angle) }

    return newBall({ ...origin }, dir, PALETTE[i % PALETTE.length])
  })
}

// 中心付近の 1 点から全方位へ扇状発射。火線(caustic)の包絡線が浮かぶ。
const fanRays = (count: number): Ball[] => {
  const origin = { x: -A * 0.2, y: 0 }

  return Array.from({ length: count }, (_, i) => {
    const angle = (TAU * i) / count
    const dir = { x: Math.cos(angle), y: Math.sin(angle) }

    return newBall({ ...origin }, dir, PALETTE[i % PALETTE.length])
  })
}

const EllipBilliards = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ballsRef = useRef<Ball[]>([])
  const configRef = useRef<Config>(DEFAULT)
  const aimRef = useRef<{ start: Vec; cur: Vec } | null>(null)
  const runningRef = useRef(true)

  const [config, setConfig] = useState<Config>(DEFAULT)
  const [running, setRunning] = useState(true)

  configRef.current = config
  runningRef.current = running

  // 設定変更で球をクリア (扁平率が変わると軌跡の幾何が無効になるため)
  const reset = (balls: Ball[] = []) => {
    ballsRef.current = balls
  }

  // ポインタ座標を楕円ローカル座標へ
  const toLocal = (e: React.PointerEvent): Vec => {
    const rect = canvasRef.current!.getBoundingClientRect()

    return {
      x: ((e.clientX - rect.left) * W) / rect.width - CX,
      y: ((e.clientY - rect.top) * H) / rect.height - CY,
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (config.mode !== 'aim') return
    const p = toLocal(e)
    const b = semiB(config.ratioB)

    if (!isInside(p, A, b)) return
    aimRef.current = { start: p, cur: p }
    canvasRef.current?.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!aimRef.current) return
    aimRef.current = { ...aimRef.current, cur: toLocal(e) }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const aim = aimRef.current

    aimRef.current = null
    if (!aim) return
    canvasRef.current?.releasePointerCapture(e.pointerId)

    const dir = { x: aim.cur.x - aim.start.x, y: aim.cur.y - aim.start.y }
    const launchDir = Math.hypot(dir.x, dir.y) < 4 ? { x: 1, y: 0.35 } : dir
    const color = PALETTE[ballsRef.current.length % PALETTE.length]

    ballsRef.current = [...ballsRef.current, newBall(aim.start, launchDir, color)]
  }

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')

    if (!ctx) return

    let raf = 0
    let prev = performance.now()

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000)

      prev = now
      const cfg = configRef.current
      const b = semiB(cfg.ratioB)

      if (runningRef.current) {
        const step = cfg.speed * dt

        ballsRef.current.forEach((ball) => advance(ball, step, A, b, cfg.trail))
      }

      draw(ctx, ballsRef.current, b, aimRef.current)
      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(raf)
  }, [])

  const update = (patch: Partial<Config>) => {
    const next = { ...configRef.current, ...patch }

    setConfig(next)
    // 楕円の形が変わったら軌跡は無効 → クリア
    if (patch.ratioB !== undefined) reset()
  }

  return (
    <Wrap>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />

      <Controls>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={config.mode}
          onChange={(_, v: Mode | null) => v && update({ mode: v })}
        >
          <ToggleButton value="aim">ドラッグで発射</ToggleButton>
          <ToggleButton value="focus">焦点扇形</ToggleButton>
          <ToggleButton value="fan">放射状</ToggleButton>
        </ToggleButtonGroup>

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              const b = semiB(config.ratioB)

              reset(
                config.mode === 'fan'
                  ? fanRays(config.rays)
                  : focusRays(config.rays, b)
              )
            }}
          >
            発射
          </Button>
          <Button variant="outlined" size="small" onClick={() => reset()}>
            クリア
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
          <Typography variant="caption">扁平率 (短軸/長軸)</Typography>
          <Slider
            size="small"
            min={0.3}
            max={0.95}
            step={0.01}
            value={config.ratioB}
            valueLabelDisplay="auto"
            onChange={(_, v) => update({ ratioB: v as number })}
          />
        </SliderRow>

        <SliderRow>
          <Typography variant="caption">速度</Typography>
          <Slider
            size="small"
            min={60}
            max={900}
            step={20}
            value={config.speed}
            valueLabelDisplay="auto"
            onChange={(_, v) => update({ speed: v as number })}
          />
        </SliderRow>

        <SliderRow>
          <Typography variant="caption">軌跡の長さ</Typography>
          <Slider
            size="small"
            min={10}
            max={400}
            step={10}
            value={config.trail}
            valueLabelDisplay="auto"
            onChange={(_, v) => update({ trail: v as number })}
          />
        </SliderRow>

        <SliderRow>
          <Typography variant="caption">発射数 (プリセット)</Typography>
          <Slider
            size="small"
            min={1}
            max={60}
            step={1}
            value={config.rays}
            valueLabelDisplay="auto"
            onChange={(_, v) => update({ rays: v as number })}
          />
        </SliderRow>
      </Controls>

      <Note>
        楕円の壁で完全反射するビリヤード。<b>焦点を通る軌道は、反射のたびに反対の焦点を通り</b>、
        やがて長軸付近に集まる (焦点扇形)。焦点を通らない軌道は共焦点の楕円/双曲線に接し、
        重なりが<b>火線 (caustic)</b> として浮かび上がる (放射状)。
      </Note>
    </Wrap>
  )
}

// === 描画 ===
const draw = (
  ctx: CanvasRenderingContext2D,
  balls: Ball[],
  b: number,
  aim: { start: Vec; cur: Vec } | null
): void => {
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#1a2733'
  ctx.fillRect(0, 0, W, H)

  // 楕円の壁
  ctx.save()
  ctx.translate(CX, CY)
  ctx.beginPath()
  ctx.ellipse(0, 0, A, b, 0, 0, TAU)
  ctx.strokeStyle = '#5b7689'
  ctx.lineWidth = 2
  ctx.stroke()

  // 長軸・短軸の補助線
  ctx.strokeStyle = 'rgba(120,150,170,0.25)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(-A, 0)
  ctx.lineTo(A, 0)
  ctx.moveTo(0, -b)
  ctx.lineTo(0, b)
  ctx.stroke()

  // 焦点
  const c = focusDistance(A, b)

  ctx.fillStyle = '#ffd54f'
  for (const fx of [-c, c]) {
    ctx.beginPath()
    ctx.arc(fx, 0, 5, 0, TAU)
    ctx.fill()
  }
  ctx.restore()

  // 各球の軌跡 + 本体
  for (const ball of balls) {
    drawTrail(ctx, ball)
  }

  // 照準線
  if (aim) {
    const s = toCanvas(aim.start)
    const e = toCanvas(aim.cur)

    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    ctx.moveTo(s.x, s.y)
    ctx.lineTo(e.x, e.y)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(s.x, s.y, 4, 0, TAU)
    ctx.fill()
  }
}

const drawTrail = (ctx: CanvasRenderingContext2D, ball: Ball): void => {
  const pts = [...ball.vertices, ball.p]

  if (pts.length >= 2) {
    ctx.strokeStyle = ball.color
    ctx.globalAlpha = 0.45
    ctx.lineWidth = 1.2
    ctx.beginPath()
    const first = toCanvas(pts[0])

    ctx.moveTo(first.x, first.y)
    for (let i = 1; i < pts.length; i++) {
      const c = toCanvas(pts[i])

      ctx.lineTo(c.x, c.y)
    }
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  // 球本体
  const head = toCanvas(ball.p)

  ctx.fillStyle = ball.color
  ctx.beginPath()
  ctx.arc(head.x, head.y, 4, 0, TAU)
  ctx.fill()
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  canvas {
    width: 100%;
    max-width: ${W}px;
    height: auto;
    border-radius: 8px;
    touch-action: none;
    cursor: crosshair;
  }
`

const Controls = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem 1.5rem;
  align-items: center;
  max-width: ${W}px;
`

const SliderRow = styled.div`
  display: flex;
  flex-direction: column;
`

const Note = styled.p`
  max-width: ${W}px;
  font-size: 0.85rem;
  line-height: 1.7;
  color: #555;
`

export default EllipBilliards
