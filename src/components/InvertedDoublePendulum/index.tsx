import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  UPRIGHT_ENERGY,
  type Vec2,
  bodyPositions,
  computeLqrGain,
  isCalm,
  jointForces,
  pendulumEnergy,
  planRecoveryPrefix,
  rk4Step,
  swingUpPump,
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
const DRAG_FORCE_MAX = 0.8
// リカバリ計画の再計画間隔 (物理ステップ数, 8 = 30Hz)
const PLAN_HOLD_STEPS = 8
// キャッチ可能スキャンの間隔 (4 = 60Hz)
const SCAN_INTERVAL = 4
// 非 LQR プレフィックスは計画どおり 0.2 秒コミットする (途中で再計画すると計画と乖離する)
const CATCH_COMMIT_STEPS = 48
// 振り上げ (swing-up) のパラメータ: Node シミュレーションで 11/12 成功を確認した値
const SWING_KE = 300
const SWING_KX = 4
const SWING_KD = 3
const PUMP_CAP = 45
const CATCH_COST = 2500
const GIVEUP_COST = 5e5
// この時間キャッチ機会が無ければ一旦エネルギーを抜いて振り直す
const DRAIN_AFTER_STEPS = 8 * 240

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

/** 角度を [-π, π] の主値へ正規化 (一回転しても直立を直立として扱う) */
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

const ExplainItem = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <div>
    <Typography variant="subtitle2">{title}</Typography>
    <Typography variant="body2" color="text.secondary">
      {children}
    </Typography>
  </div>
)

type ControlMode = 'lqr' | 'catch' | 'pump' | 'drain'

type SwingUp = {
  mode: 'pump' | 'catch'
  phase: 'pump' | 'drain'
  hold: number
  held: number | null
  jitter: number
  lastProgress: number
  fails: number
  highSince: number
}

const initialSwingUp = (): SwingUp => ({
  mode: 'pump',
  phase: 'pump',
  hold: 0,
  held: null,
  jitter: 1,
  lastProgress: 0,
  fails: 0,
  highSince: -1,
})

const InvertedDoublePendulum = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stateRef = useRef<State>(initialState())
  const dragRef = useRef<Drag>({ active: false, mx: 0, my: 0 })
  const forceRef = useRef(0)
  const extRef = useRef<Vec2>({ x: 0, y: 0 })
  const suRef = useRef<SwingUp>(initialSwingUp())
  const stepCountRef = useRef(0)
  const modeRef = useRef<ControlMode>('lqr')
  const targetRef = useRef(0)
  const noiseRef = useRef(0)
  const controlRef = useRef(true)
  const showForcesRef = useRef(true)
  const [isControlOn, setIsControlOn] = useState(true)
  const [showForces, setShowForces] = useState(true)
  const [target, setTarget] = useState(0)
  const [noise, setNoise] = useState(0)
  const [modeLabel, setModeLabel] = useState('LQR')

  const gain = useMemo(() => computeLqrGain(LQR_Q, LQR_R), [])

  controlRef.current = isControlOn
  showForcesRef.current = showForces
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
      extRef.current = { x: fx, y: fy }

      let u = 0

      stepCountRef.current++
      const t = stepCountRef.current

      if (controlRef.current) {
        const err = s.map((v, i) => {
          if (i === 0) return v - targetRef.current
          if (i === 1 || i === 2) return wrapAngle(v)
          return v
        })
        const lqrOut = Math.max(
          -FORCE_MAX,
          Math.min(FORCE_MAX, -gain.reduce((sum, k, i) => sum + k * err[i], 0))
        )
        // プランナーは目標相対座標で回すので、レール境界も target 分ずらす
        const planCtx = {
          gain,
          forceMax: FORCE_MAX,
          trackLow: -TRACK_HALF - targetRef.current,
          trackHigh: TRACK_HALF - targetRef.current,
        }
        const su = suRef.current

        if (isCalm(err)) {
          u = lqrOut
          su.mode = 'pump'
          su.phase = 'pump'
          su.lastProgress = t
          su.fails = 0
          su.highSince = -1
          modeRef.current = 'lqr'
        } else {
          if (su.mode === 'catch') {
            // 安定域外: 数候補をロールアウトして最も直立へ戻る力を選ぶ
            if (su.hold <= 0) {
              const { prefix, cost } = planRecoveryPrefix(err, planCtx, fx, fy)

              if (cost > GIVEUP_COST) {
                su.mode = 'pump'
                su.fails++
                // キャッチ失敗が続いたら一旦エネルギーを抜いて振り直す
                if (su.fails >= 5) su.phase = 'drain'
              } else {
                su.held = prefix
                su.hold = prefix === null ? PLAN_HOLD_STEPS : CATCH_COMMIT_STEPS
              }
            }
            if (su.mode === 'catch') {
              u = su.held === null ? lqrOut : su.held
              su.hold--
              modeRef.current = 'catch'
            }
          }
          if (su.mode === 'pump') {
            // キャッチ可能な瞬間をスキャン (ドレイン中は振り直しに専念)
            if (t % SCAN_INTERVAL === 0 && su.phase !== 'drain') {
              const { cost } = planRecoveryPrefix(err, planCtx, fx, fy)

              if (cost < CATCH_COST) {
                su.mode = 'catch'
                su.hold = 0
              }
            }
            if (su.mode === 'pump') {
              // 振り上げ: エネルギーポンピング + キャッチ機会が無ければ仕切り直し
              const e = pendulumEnergy(err)

              // エネルギーは足りているのにキャッチできない tumbling が続いたら振り直す
              if (e > UPRIGHT_ENERGY * 0.8 && su.phase === 'pump') {
                if (su.highSince < 0) su.highSince = t
                else if (t - su.highSince > 3 * 240) su.phase = 'drain'
              } else if (e < UPRIGHT_ENERGY * 0.8) {
                su.highSince = -1
              }
              if (
                su.phase === 'pump' &&
                t - su.lastProgress > DRAIN_AFTER_STEPS
              )
                su.phase = 'drain'
              if (su.phase === 'drain' && e < 1) {
                su.phase = 'pump'
                su.lastProgress = t
                su.fails = 0
                su.highSince = -1
                // 決定論だと同じ失敗軌道をなぞるため、振り直しごとに力の上限を揺らす
                su.jitter = 0.6 + Math.random() * 0.9
              }
              const targetEnergy = su.phase === 'drain' ? 0 : UPRIGHT_ENERGY
              const cap = PUMP_CAP * su.jitter
              let pump = swingUpPump(err, targetEnergy, SWING_KE)

              pump = Math.max(-cap, Math.min(cap, pump))
              // 完全静止からの起動キック
              if (
                su.phase === 'pump' &&
                Math.abs(err[4]) < 0.05 &&
                Math.abs(err[5]) < 0.05 &&
                targetEnergy - e > 4
              )
                pump = cap
              u = pump - SWING_KX * err[0] - SWING_KD * err[3]
              u = Math.max(-FORCE_MAX, Math.min(FORCE_MAX, u))
              modeRef.current = su.phase === 'drain' ? 'drain' : 'pump'
            }
          }
        }
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

      // 関節の拘束力ベクトル
      if (showForcesRef.current) {
        const drawForceArrow = (
          at: { x: number; y: number },
          f: Vec2,
          color: string
        ) => {
          const mag = Math.hypot(f.x, f.y)

          if (mag < 0.1) return
          const scale = Math.min(6, 90 / mag)
          const o = toPx(at.x, at.y)
          const ex = o.px + f.x * scale
          const ey = o.py - f.y * scale
          const ang = Math.atan2(ey - o.py, ex - o.px)

          ctx.strokeStyle = color
          ctx.fillStyle = color
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.moveTo(o.px, o.py)
          ctx.lineTo(ex, ey)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(ex + Math.cos(ang) * 8, ey + Math.sin(ang) * 8)
          ctx.lineTo(ex + Math.cos(ang + 2.5) * 7, ey + Math.sin(ang + 2.5) * 7)
          ctx.lineTo(ex + Math.cos(ang - 2.5) * 7, ey + Math.sin(ang - 2.5) * 7)
          ctx.closePath()
          ctx.fill()
          ctx.font = '11px monospace'
          ctx.fillText(`${mag.toFixed(1)}N`, ex + 6, ey - 4)
        }
        const { r1, r2, onCart } = jointForces(
          s,
          u,
          extRef.current.x,
          extRef.current.y
        )

        drawForceArrow(cart, onCart, '#4dd0a5')
        drawForceArrow(p1, r1, '#64b5f6')
        drawForceArrow(p2, r2, '#f48fb1')
        ctx.font = '11px monospace'
        ctx.fillStyle = '#4dd0a5'
        ctx.fillText('リンク1→カート', 16, 44)
        ctx.fillStyle = '#64b5f6'
        ctx.fillText('リンク1→オモリ1', 16, 58)
        ctx.fillStyle = '#f48fb1'
        ctx.fillText('リンク2→オモリ2', 16, 72)
      }

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

      const energy = pendulumEnergy(s)

      ctx.fillText(
        `θ1=${deg(s[1])}°  θ2=${deg(s[2])}°  u=${u.toFixed(1)}N  E=${energy.toFixed(1)}/${UPRIGHT_ENERGY.toFixed(1)}`,
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
      const labels: Record<ControlMode, string> = {
        lqr: 'LQR',
        catch: 'キャッチ',
        pump: '振り上げ',
        drain: '仕切り直し',
      }

      setModeLabel(controlRef.current ? labels[modeRef.current] : '制御OFF')
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
    suRef.current = initialSwingUp()
  }

  const hangDown = () => {
    stateRef.current = [0, Math.PI, Math.PI - 0.01, 0, 0, 0]
    suRef.current = initialSwingUp()
  }

  const poke = () => {
    const s = stateRef.current
    const kick = (Math.random() < 0.5 ? -1 : 1) * (1.1 + Math.random() * 0.4)

    stateRef.current = s.map((v, i) => (i === 5 ? v + kick : v))
  }

  return (
    <Wrap>
      <Typography variant="body2" color="text.secondary">
        カート (支点)
        の左右移動だけで二重振り子を直立に保つ制御シミュレーション。直立付近は
        LQR
        で維持し、転倒後はエネルギーポンピングで振り上げてから再び直立へ復帰する。先端のオモリはドラッグで引っ張って外乱を与えられる。
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
        <FormControlLabel
          control={
            <Switch
              checked={showForces}
              onChange={(e) => setShowForces(e.target.checked)}
            />
          }
          label="関節力を表示"
        />
        <Button variant="outlined" size="small" onClick={reset}>
          リセット
        </Button>
        <Button variant="outlined" size="small" onClick={poke}>
          小突く
        </Button>
        <Button variant="outlined" size="small" onClick={hangDown}>
          ぶら下げから振り上げ
        </Button>
        <Typography
          variant="body2"
          color={modeLabel === 'LQR' ? 'success.main' : 'warning.main'}
          sx={{ minWidth: 80 }}
        >
          {modeLabel}
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
        {PARAMS.len1}m ×2。現在の制御モードは HUD と状態表示に出る (LQR /
        キャッチ / 振り上げ / 仕切り直し)。
      </Typography>
      <Accordion disableGutters>
        <AccordionSummary expandIcon={<span>▾</span>}>
          <Typography variant="subtitle2">仕組みの解説</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1.5}>
            <ExplainItem title="物理モデル">
              ラグランジュ力学から導いた運動方程式を RK4 (240Hz)
              で積分。入力はカートへの水平力 1 つだけで、関節は無駆動
              (微小な軸摩擦のみ)。カートを加速すると支点の反力が振り子への実効トルクになる、という連成だけで姿勢を操る。
            </ExplainItem>
            <ExplainItem title="直立維持 (LQR)">
              直立平衡点まわりで有限差分線形化し、Riccati
              反復で状態フィードバックゲイン K を算出。u = -K(状態 - 目標)
              でカート力を決める。二重倒立振り子の安定域は非常に狭く、先端への持続外乱
              約 1N・角速度 約 2rad/s が回復限界。
            </ExplainItem>
            <ExplainItem title="リカバリ計画">
              安定域を外れたら、実物理モデルで「最初の 0.2 秒に加える力」7 候補
              (LQR 継続を含む) をそれぞれ 0.7
              秒先までロールアウトし、最も直立に近づく候補を採用。LQR
              継続が常に候補にあるため、LQR 単体より悪化しない。
            </ExplainItem>
            <ExplainItem title="振り上げ (swing-up)">
              支点系の振り子エネルギー E を直立相当 E_up までポンピングする。σ =
              (m1+m2)l1·θ̇1cosθ1 + m2l2·θ̇2cosθ2 として u ∝ -(E_up - E)·σ にすると
              dE/dt ∝ (E_up - E)·σ²
              となり、不足時は注入・過剰時は抽出が常に正しい向きに働く。
            </ExplainItem>
            <ExplainItem title="キャッチ">
              振り上げ中は 60Hz
              でロールアウトコストを監視し、閾値を下回った瞬間にリカバリ計画へ切り替える。計画した
              0.2 秒の力は途中で再計画せずコミットして実行する
              (細切れに再計画すると計画と実行が乖離するため)。
            </ExplainItem>
            <ExplainItem title="詰み回避">
              キャッチ失敗が続く場合や、エネルギーは足りているのにキャッチ可能な姿勢を通らない回転
              (tumbling)
              が続く場合は、一旦エネルギーを抜いて振り直す。系は決定論なので、振り直しごとに力の上限を乱数で揺らし、毎回違う軌道を試す。
            </ExplainItem>
            <ExplainItem title="関節力の表示">
              各ピン関節が伝える拘束力を質点の加速度から逆算して矢印表示。静止直立時は上のオモリの重量を支える鉛直ベクトルになり、リカバリ中はカートの急加速が斜めの大きな反力として現れる。
            </ExplainItem>
            <ExplainItem title="実装上の落とし穴">
              振り上げでリンクが一回転すると角度が 2π
              巻き込んだままになり、物理的には直立でも制御器には大誤差に見えて
              LQR へ引き渡せない。角度を [-π, π]
              へ正規化して解決した。これが入るまで復帰成功率が大きく落ちていた。
            </ExplainItem>
          </Stack>
        </AccordionDetails>
      </Accordion>
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
