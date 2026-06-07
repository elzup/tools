import {
  Button,
  Checkbox,
  FormControlLabel,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

// ストロボ点滅の見せ方
//   hold  = サンプル&ホールド (点滅した瞬間の角度を次の点滅まで保持) → 見かけの回転が分かりやすい
//   flash = 短いフラッシュ + 暗転 (残像で snapshot が見える、実際のストロボに近い)
type StrobeMode = 'hold' | 'flash'

// 表示モード: wheel=回転円盤 / flip=絵文字パラパラ漫画
type DisplayMode = 'wheel' | 'flip'

// パラパラ漫画の絵文字シーケンス (1 周 = frames を一巡)
const FLIP_SEQS = {
  clock: {
    label: '時計',
    frames: ['🕛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚'], // prettier-ignore
  },
  moon: {
    label: '月',
    frames: ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'],
  },
  arrow: {
    label: '矢印',
    frames: ['⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️'],
  },
} as const

type FlipKey = keyof typeof FLIP_SEQS

type Config = {
  displayMode: DisplayMode
  rotHz: number // 回転数 / コマ送り速度 (Hz = 周/秒)
  strobeHz: number // ストロボ点滅周波数 (Hz)
  strobeOn: boolean
  mode: StrobeMode
  spokes: number // 放射スポーク本数 (ワゴンホイール効果用)
  flipSeq: FlipKey
}

const DEFAULT: Config = {
  displayMode: 'wheel', // 既定は従来の円盤を維持
  rotHz: 2,
  strobeHz: 1.6, // 回転数とわずかにずらし、ロード直後はゆっくり動いて見える状態にする
  strobeOn: true,
  mode: 'hold',
  spokes: 6,
  flipSeq: 'clock',
}

const CANVAS = 420
const FLASH_DUTY = 0.12 // flash モードの点灯デューティ比

const TAU = Math.PI * 2

// 見かけの周波数 (Hz)。実周波数を strobe で標本化したときの折り返し。
// rotHz が strobeHz の整数倍に一致すると 0 = 静止して見える。
const apparentHz = (rotHz: number, strobeHz: number): number => {
  if (strobeHz <= 0) return rotHz

  return rotHz - strobeHz * Math.round(rotHz / strobeHz)
}

const apparentLabel = (hz: number): string => {
  if (Math.abs(hz) < 0.03) return '静止して見える'

  return hz > 0 ? `前進 ${hz.toFixed(2)} Hz` : `後退 ${Math.abs(hz).toFixed(2)} Hz`
}

// 連続位相を strobe で標本化した「見かけの位相」(周。整数部含む)を返す。
//   continuous なら実位相、hold なら直近フラッシュ時刻の位相。
const sampledCycle = (c: Config, t: number): number => {
  if (!c.strobeOn || c.strobeHz <= 0) return c.rotHz * t
  if (c.mode === 'flash') return c.rotHz * t // flash は実位相 (点滅で snapshot を見せる)

  const period = 1 / c.strobeHz
  const lastFlash = Math.floor(t / period) * period

  return c.rotHz * lastFlash
}

// flash モードで今この瞬間が「点灯中」か (連続/hold は常時点灯扱い)
const flashBrightness = (c: Config, t: number): number => {
  if (!c.strobeOn || c.strobeHz <= 0 || c.mode !== 'flash') return 1
  const period = 1 / c.strobeHz
  const phase = (t % period) / period

  return phase < FLASH_DUTY ? 1 : 0.05
}

const drawWheel = (
  ctx: CanvasRenderingContext2D,
  angle: number,
  spokes: number,
  brightness: number
): void => {
  const cx = CANVAS / 2
  const cy = CANVAS / 2
  const radius = CANVAS / 2 - 16

  ctx.clearRect(0, 0, CANVAS, CANVAS)
  ctx.fillStyle = '#111'
  ctx.fillRect(0, 0, CANVAS, CANVAS)

  ctx.save()
  ctx.globalAlpha = brightness
  ctx.translate(cx, cy)
  ctx.rotate(angle)

  // 外周リング
  ctx.beginPath()
  ctx.arc(0, 0, radius, 0, TAU)
  ctx.strokeStyle = '#555'
  ctx.lineWidth = 4
  ctx.stroke()

  // スポーク (ワゴンホイール効果)
  ctx.strokeStyle = '#888'
  ctx.lineWidth = 3
  for (let i = 0; i < spokes; i++) {
    const a = (TAU * i) / spokes
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius)
    ctx.stroke()
  }

  // 基準マーカー (単一回転の静止が分かるよう目立つ色で)
  const markX = radius - 26
  ctx.fillStyle = '#ff5252'
  ctx.beginPath()
  ctx.arc(markX, 0, 18, 0, TAU)
  ctx.fill()

  // 中心ハブ
  ctx.fillStyle = '#ddd'
  ctx.beginPath()
  ctx.arc(0, 0, 10, 0, TAU)
  ctx.fill()

  ctx.restore()
}

const StrobeWheel = () => {
  const [config, setConfig] = useState<Config>(DEFAULT)
  const { displayMode, rotHz, strobeHz, strobeOn, mode, spokes, flipSeq } =
    config
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const emojiRef = useRef<HTMLSpanElement>(null)

  // 描画ループは ref 経由で最新値を読む (rAF を張り替えない)
  const cfgRef = useRef(config)
  cfgRef.current = config

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d') ?? null

    let raf = 0
    const start = performance.now()

    const loop = (now: number) => {
      const t = (now - start) / 1000
      const c = cfgRef.current
      const cycle = sampledCycle(c, t)
      const brightness = flashBrightness(c, t)

      if (c.displayMode === 'wheel') {
        if (ctx) drawWheel(ctx, TAU * cycle, c.spokes, brightness)
      } else {
        const emoji = emojiRef.current

        if (emoji) {
          const frames = FLIP_SEQS[c.flipSeq].frames
          const frac = ((cycle % 1) + 1) % 1 // 0..1 (負位相も正に正規化)
          const idx = Math.floor(frac * frames.length) % frames.length

          emoji.textContent = frames[idx]
          emoji.style.opacity = String(brightness)
        }
      }

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(raf)
  }, [])

  const update = <K extends keyof Config>(key: K, value: Config[K]) =>
    setConfig((c) => ({ ...c, [key]: value }))

  const sync = () => setConfig((c) => ({ ...c, strobeHz: c.rotHz }))

  const apparent = strobeOn ? apparentHz(rotHz, strobeHz) : rotHz
  const isFlip = displayMode === 'flip'
  const speedLabel = isFlip ? 'コマ送り速度' : '円盤の回転数'

  return (
    <Wrap>
      <Stage>
        <canvas
          ref={canvasRef}
          width={CANVAS}
          height={CANVAS}
          style={{
            display: isFlip ? 'none' : 'block',
            width: '100%',
            maxWidth: CANVAS,
            borderRadius: 8,
          }}
        />
        <EmojiStage style={{ display: isFlip ? 'flex' : 'none' }}>
          <span ref={emojiRef} />
        </EmojiStage>
      </Stage>

      <Controls>
        <ToggleButtonGroup
          value={displayMode}
          exclusive
          size="small"
          onChange={(_, v) => v && update('displayMode', v as DisplayMode)}
        >
          <ToggleButton value="wheel">円盤</ToggleButton>
          <ToggleButton value="flip">パラパラ漫画</ToggleButton>
        </ToggleButtonGroup>

        <Field>
          <Typography gutterBottom>
            {speedLabel}: <strong>{rotHz.toFixed(2)} Hz</strong>
            {isFlip ? ' (周/秒)' : ` (${Math.round(rotHz * 60)} rpm)`}
          </Typography>
          <Slider
            value={rotHz}
            min={0.2}
            max={30}
            step={0.1}
            onChange={(_, v) => update('rotHz', v as number)}
          />
        </Field>

        <Field>
          <Row $between>
            <Typography>
              ストロボ点滅: <strong>{strobeHz.toFixed(2)} Hz</strong>
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={!strobeOn}
                  onChange={(e) => update('strobeOn', !e.target.checked)}
                />
              }
              label="連続"
            />
          </Row>
          <Slider
            value={strobeHz}
            min={0.2}
            max={30}
            step={0.1}
            disabled={!strobeOn}
            onChange={(_, v) => update('strobeHz', v as number)}
          />
        </Field>

        <Row>
          <ToggleButtonGroup
            value={mode}
            exclusive
            size="small"
            disabled={!strobeOn}
            onChange={(_, v) => v && update('mode', v as StrobeMode)}
          >
            <ToggleButton value="hold">ホールド</ToggleButton>
            <ToggleButton value="flash">フラッシュ</ToggleButton>
          </ToggleButtonGroup>

          <Button
            variant="outlined"
            size="small"
            disabled={!strobeOn}
            onClick={sync}
          >
            速度に同期
          </Button>
        </Row>

        {isFlip ? (
          <Field>
            <Typography gutterBottom>コマ (絵文字)</Typography>
            <ToggleButtonGroup
              value={flipSeq}
              exclusive
              size="small"
              onChange={(_, v) => v && update('flipSeq', v as FlipKey)}
            >
              {(Object.keys(FLIP_SEQS) as FlipKey[]).map((key) => (
                <ToggleButton key={key} value={key}>
                  {FLIP_SEQS[key].frames[0]} {FLIP_SEQS[key].label} (
                  {FLIP_SEQS[key].frames.length})
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Field>
        ) : (
          <Field>
            <Typography gutterBottom>スポーク本数: {spokes}</Typography>
            <Slider
              value={spokes}
              min={1}
              max={16}
              step={1}
              marks
              onChange={(_, v) => update('spokes', v as number)}
            />
          </Field>
        )}

        <Status $stopped={Math.abs(apparent) < 0.03}>
          {isFlip ? '見かけのコマ送り' : '見かけの回転'}:{' '}
          <strong>{apparentLabel(apparent)}</strong>
        </Status>

        <Help>
          {speedLabel}は変えず、ストロボの点滅を{isFlip ? 'コマ送り' : '回転'}
          速度に近づけてみてください。点滅が速度（やその整数倍）に一致すると、毎回同じ
          {isFlip ? 'コマ' : '位置'}で照らされるため<strong>止まって見えます</strong>。
          少しずらすと、ゆっくり前進・後退して見える（ワゴンホイール効果 /
          逆再生）のが体験できます。
        </Help>
      </Controls>
    </Wrap>
  )
}

const Wrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-start;
`

const Stage = styled.div`
  width: 100%;
  max-width: ${CANVAS}px;
`

const EmojiStage = styled.div`
  width: 100%;
  max-width: ${CANVAS}px;
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
  background: #111;
  border-radius: 8px;
  font-size: 210px;
  line-height: 1;
  user-select: none;
`

const Controls = styled.div`
  flex: 1;
  min-width: 280px;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const Field = styled.div``

const Row = styled.div<{ $between?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: ${(p) => (p.$between ? 'space-between' : 'flex-start')};
`

const Status = styled.div<{ $stopped: boolean }>`
  padding: 8px 12px;
  border-radius: 6px;
  background: ${(p) => (p.$stopped ? '#1b5e20' : '#333')};
  color: #fff;
  transition: background 0.2s;
`

const Help = styled.p`
  font-size: 13px;
  line-height: 1.7;
  color: #666;
  margin: 0;
`

export default StrobeWheel
