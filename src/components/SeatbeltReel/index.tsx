import {
  Button,
  FormControlLabel,
  Slider,
  Switch,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

// 実機の「ウェビング感応式」慣性ロックの物理シミュレーション。
// ベルト端を質量ばね・ダンパ系で表現し、手はばねでベルト端を引っぱる。
//   m·L'' = F_hand + F_retract + F_damp
// フライウェイト(遠心ポール)は引き出し速度の2乗で開く: pawl_eq ∝ (L')²。
// pawl が噛み込み角に達するとラチェットがロック(引き出し方向のみ拘束)。
// → ゆっくり引けば速度が低くポールが開かず出る。速く引くと遠心力で噛んで止まる。

const CANVAS_W = 480
const CANVAS_H = 360
const TOP_Y = 44 // ベルト上端 (スプール出口) の y
const MAX_L = 250 // ベルト最大引き出し量(px)
const TAU = Math.PI * 2

// 物理パラメータ (px, s, 質量は無次元)
const M = 1 // ベルト端の等価質量(スプール慣性)
const K_HAND = 110 // 手ばねの剛性 (掴んだ点へ引き寄せる。大きいほど追従が速い)
const C_HAND = 18 // 手ばねの減衰 (臨界 ~2√(K·M) 付近で素早く収束)
const K_RET = 7 // 巻き取りばねの剛性
const C_SYS = 3 // 系の減衰
const V_MAX = 4000 // 速度クランプ
const PAWL_RATE = 18 // フライウェイト追従の速さ

type Config = {
  threshold: number // フライウェイトが噛む引き出し速度 (px/s)。小さいほど敏感
  springBack: boolean // 巻き取りばねの有無
}

const DEFAULT: Config = { threshold: 520, springBack: true }

// スプール (右側の機構図) の配置
const SPOOL = { x: 344, y: 176, r: 72 }
const TEETH = 14

type Sim = {
  L: number // 現在の引き出し量
  v: number // ベルト端速度 (px/s, 引き出し方向+)
  pawl: number // フライウェイト開度 (0=閉, 1=噛み込み)
  locked: boolean
  lockedL: number
  dragging: boolean
  pointerY: number
  grabOffset: number // 掴んだ点とベルト端の差 (相対ドラッグの基準)
  justGrabbed: boolean // 掴んだ直後フレームは速度をリセット
  prevT: number
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v))

const SeatbeltReel = () => {
  const [config, setConfig] = useState<Config>(DEFAULT)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const cfgRef = useRef(config)
  cfgRef.current = config

  const sim = useRef<Sim>({
    L: 60,
    v: 0,
    pawl: 0,
    locked: false,
    lockedL: 0,
    dragging: false,
    pointerY: TOP_Y + 60,
    grabOffset: 0,
    justGrabbed: false,
    prevT: 0,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d') ?? null
    if (!canvas || !ctx) return

    let raf = 0
    sim.current.prevT = performance.now()

    const step = (now: number) => {
      const s = sim.current
      const c = cfgRef.current
      const dt = Math.min(0.05, (now - s.prevT) / 1000) || 0.016
      s.prevT = now

      // 手の目標位置 (掴んでいる時だけベルト端を引っぱる)
      const handL = s.dragging ? s.pointerY - TOP_Y - s.grabOffset : null

      if (s.dragging && s.justGrabbed) {
        s.v = 0
        s.justGrabbed = false
      }

      if (s.locked) {
        // ラチェットが噛んでいる: 引き出し方向のみ拘束。手を緩めたら解除。
        s.v = 0
        const releasing = handL == null || handL < s.lockedL - 1
        if (releasing) {
          s.locked = false
        } else {
          s.L = s.lockedL
          s.pawl += (1.3 - s.pawl) * Math.min(1, dt * PAWL_RATE)
        }
      }

      if (!s.locked) {
        // 質量ばね・ダンパ系を積分: m·L'' = F_hand + F_retract + F_damp
        let force = -C_SYS * s.v
        if (handL != null) {
          force += K_HAND * (handL - s.L) - C_HAND * s.v
        }
        if (c.springBack) {
          force += -K_RET * s.L // 巻き取りばね (L=0 へ)
        }
        s.v = clamp(s.v + (force / M) * dt, -V_MAX, V_MAX)
        s.L += s.v * dt
        if (s.L <= 0) {
          s.L = 0
          if (s.v < 0) s.v = 0
        }
        if (s.L >= MAX_L) {
          s.L = MAX_L
          if (s.v > 0) s.v = 0
        }

        // フライウェイト: 引き出し速度の2乗で開く。噛み込みでロック。
        const out = Math.max(0, s.v)
        const eq = (out / Math.max(40, c.threshold)) ** 2
        s.pawl += (eq - s.pawl) * Math.min(1, dt * PAWL_RATE)
        if (s.pawl >= 1 && s.v > 0) {
          s.locked = true
          s.lockedL = s.L
          s.v = 0
        }
      }

      draw(ctx, s, c)
      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)

    return () => cancelAnimationFrame(raf)
  }, [])

  const toCanvasY = (clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return clientY
    const rect = canvas.getBoundingClientRect()

    return ((clientY - rect.top) / rect.height) * CANVAS_H
  }

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const s = sim.current
    const py = toCanvasY(e.clientY)
    s.dragging = true
    s.pointerY = py
    // 掴んだ点を現在のベルト端に対応づける(どこを掴んでも飛ばない・速度0)
    s.grabOffset = py - (TOP_Y + s.L)
    s.justGrabbed = true
    s.v = 0
    s.prevT = performance.now()
  }

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = sim.current
    if (!s.dragging) return
    s.pointerY = toCanvasY(e.clientY)
  }

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    sim.current.dragging = false
  }

  const update = <K extends keyof Config>(key: K, value: Config[K]) =>
    setConfig((c) => ({ ...c, [key]: value }))

  const reset = () => {
    const s = sim.current
    s.L = 60
    s.v = 0
    s.pawl = 0
    s.locked = false
    s.dragging = false
  }

  return (
    <Wrap>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{
          width: '100%',
          maxWidth: CANVAS_W,
          borderRadius: 8,
          touchAction: 'none',
          cursor: 'grab',
        }}
      />

      <Controls>
        <Typography variant="body2" color="text.secondary">
          左の<strong>バックル</strong>を掴んで下に引いてみてください。
          ゆっくり引くと出てきますが、勢いよく引くとロックがかかります。
        </Typography>

        <Field>
          <Typography gutterBottom>
            ロック感度 (しきい値): <strong>{config.threshold}</strong> px/s
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
            >
              {' '}
              小さいほど敏感
            </Typography>
          </Typography>
          <Slider
            value={config.threshold}
            min={200}
            max={1000}
            step={20}
            onChange={(_, v) => update('threshold', v as number)}
          />
        </Field>

        <Row>
          <FormControlLabel
            control={
              <Switch
                checked={config.springBack}
                onChange={(e) => update('springBack', e.target.checked)}
              />
            }
            label="巻き取りばね"
          />
          <Button variant="outlined" size="small" onClick={reset}>
            リセット
          </Button>
        </Row>

        <Help>
          実車の ELR (緊急時ロック式リトラクター)
          には、ベルトを引く速さに反応する<strong>ウェビング感応式</strong>と、
          車体の急減速に反応する車体感応式があります。これは前者の再現で、
          スプールが速く回ると<strong>遠心力でポールが開き</strong>、
          外周のラチェット歯に噛んで回転を止めます。緩めると遠心力が消えて解除されます。
        </Help>
      </Controls>
    </Wrap>
  )
}

// ---- 描画 ----

const draw = (ctx: CanvasRenderingContext2D, s: Sim, c: Config) => {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
  ctx.fillStyle = '#1b1b1f'
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  drawBelt(ctx, s)
  drawReel(ctx, s)
  drawSpeedMeter(ctx, s, c)
}

const drawBelt = (ctx: CanvasRenderingContext2D, s: Sim) => {
  const x = 96
  const w = 56
  const topY = TOP_Y
  const botY = topY + s.L
  const locked = s.locked

  // 出口スロット
  ctx.fillStyle = '#444'
  ctx.fillRect(x - 10, topY - 12, w + 20, 12)

  // ウェビング(帯)
  ctx.fillStyle = locked ? '#7a2b2b' : '#37474f'
  ctx.fillRect(x, topY, w, Math.max(2, s.L))

  // 織りストライプ
  ctx.strokeStyle = locked ? '#b35a5a' : '#55707d'
  ctx.lineWidth = 1
  for (let y = topY + 8; y < botY; y += 10) {
    ctx.beginPath()
    ctx.moveTo(x + 4, y)
    ctx.lineTo(x + w - 4, y)
    ctx.stroke()
  }

  // バックル(掴む所)
  const bh = 30
  ctx.fillStyle = locked ? '#e53935' : '#90a4ae'
  roundRect(ctx, x - 8, botY, w + 16, bh, 6)
  ctx.fill()
  ctx.fillStyle = '#1b1b1f'
  ctx.fillRect(x + 6, botY + bh / 2 - 3, w - 12, 6)

  // ラベル
  ctx.fillStyle = '#888'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('↓ 掴んで引く', x + w / 2, botY + bh + 18)
}

const drawReel = (ctx: CanvasRenderingContext2D, s: Sim) => {
  const { x, y, r } = SPOOL
  // 巻き出し回転角 (見た目用)
  const theta = s.L / 26

  // 外周ラチェット(固定歯)
  ctx.save()
  ctx.translate(x, y)
  ctx.strokeStyle = '#666'
  ctx.lineWidth = 2
  ctx.fillStyle = '#2a2a30'
  ctx.beginPath()
  ctx.arc(0, 0, r + 22, 0, TAU)
  ctx.fill()
  ctx.stroke()
  // 歯(のこぎり状)
  ctx.fillStyle = '#555'
  for (let i = 0; i < TEETH; i++) {
    const a = (TAU * i) / TEETH
    const a2 = (TAU * (i + 0.5)) / TEETH
    ctx.beginPath()
    ctx.moveTo(Math.cos(a) * (r + 6), Math.sin(a) * (r + 6))
    ctx.lineTo(Math.cos(a) * (r + 20), Math.sin(a) * (r + 20))
    ctx.lineTo(Math.cos(a2) * (r + 6), Math.sin(a2) * (r + 6))
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()

  // スプール本体 (回転するウェビングの巻き)
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(theta)
  ctx.fillStyle = '#3b3b44'
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, TAU)
  ctx.fill()
  // 巻きの放射マーク(回転が見える)
  ctx.strokeStyle = '#5a5a66'
  ctx.lineWidth = 2
  for (let i = 0; i < 8; i++) {
    const a = (TAU * i) / 8
    ctx.beginPath()
    ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 14)
    ctx.lineTo(Math.cos(a) * (r - 6), Math.sin(a) * (r - 6))
    ctx.stroke()
  }
  ctx.fillStyle = '#88909c'
  ctx.beginPath()
  ctx.arc(0, 0, 12, 0, TAU)
  ctx.fill()
  ctx.restore()

  // 遠心ウェイト: スプールと一緒に回り、遠心力で外へ開いて外周ラチェットに噛む
  drawFlyweights(ctx, x, y, r, theta, clamp(s.pawl, 0, 1), s.locked)

  // ステータス
  ctx.fillStyle = s.locked ? '#ef5350' : '#9ccc65'
  ctx.font = 'bold 16px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(s.locked ? '🔒 ロック中' : '🟢 フリー', x, y + r + 44)
}

// スプール上の遠心ウェイト (ウェビング感応式)。
// スプールと一緒に回り (theta)、遠心力 open で外へ開き、外周ラチェットに噛む。
const drawFlyweights = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  theta: number,
  open: number,
  locked: boolean
) => {
  const o = clamp(open, 0, 1)
  const rPiv = r * 0.4 // ピボット半径 (スプール上)
  const restR = r * 0.6 // ウェイト中心 (閉)
  const outR = r + 8 // ウェイト中心 (噛み込み: 外周歯に届く)
  const weightR = restR + (outR - restR) * o

  for (let k = 0; k < 2; k++) {
    const base = theta + k * Math.PI
    const px = cx + Math.cos(base) * rPiv
    const py = cy + Math.sin(base) * rPiv
    // 閉時はやや接線寄り、開くほど半径方向へ
    const wa = base + 0.22 * (1 - o)
    const wx = cx + Math.cos(wa) * weightR
    const wy = cy + Math.sin(wa) * weightR

    // 戻しばね (ピボット→ウェイト, 開くと伸びる様子)
    ctx.strokeStyle = 'rgba(150,150,160,0.5)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(wx, wy)
    ctx.stroke()

    // アーム
    ctx.strokeStyle = locked ? '#ef5350' : '#cfcfcf'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(wx, wy)
    ctx.stroke()

    // 遠心ウェイト(重り)
    ctx.fillStyle = locked ? '#e53935' : '#9e9e9e'
    ctx.beginPath()
    ctx.arc(wx, wy, 8, 0, TAU)
    ctx.fill()
    // 噛み込み時に歯との接点を強調
    if (locked) {
      ctx.strokeStyle = '#ffcdd2'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    // ピボット
    ctx.fillStyle = '#777'
    ctx.beginPath()
    ctx.arc(px, py, 3.5, 0, TAU)
    ctx.fill()
  }
}

const drawSpeedMeter = (ctx: CanvasRenderingContext2D, s: Sim, c: Config) => {
  const x = 24
  const y = CANVAS_H - 26
  const w = CANVAS_W - 48
  const h = 12
  const speed = Math.abs(s.v)
  const maxShow = 1100
  const ratio = clamp(speed / maxShow, 0, 1)
  const thRatio = clamp(c.threshold / maxShow, 0, 1)

  ctx.fillStyle = '#2a2a30'
  roundRect(ctx, x, y, w, h, 6)
  ctx.fill()

  ctx.fillStyle = speed > c.threshold ? '#ef5350' : '#42a5f5'
  roundRect(ctx, x, y, Math.max(2, w * ratio), h, 6)
  ctx.fill()

  // しきい値ライン
  const tx = x + w * thRatio
  ctx.strokeStyle = '#ffb300'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(tx, y - 4)
  ctx.lineTo(tx, y + h + 4)
  ctx.stroke()

  ctx.fillStyle = '#999'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('引く速さ', x, y - 6)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#ffb300'
  ctx.fillText('ロックしきい値', x + w, y - 6)
}

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

const Wrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-start;
`

const Controls = styled.div`
  flex: 1;
  min-width: 280px;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const Field = styled.div``

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
`

const Help = styled.p`
  font-size: 13px;
  line-height: 1.7;
  color: #666;
  margin: 0;
`

export default SeatbeltReel
