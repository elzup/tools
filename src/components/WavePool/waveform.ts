// 各造波機が流している駆動信号 amp·cos(ωt + φ) を、円周順に縦へ積んだ時系列波形として描く。
// 「到着基準」では各信号を伝搬距離ぶん遅らせ (φ − k·r)、ターゲットに届いた時点の波形として並べる

import { type Drive, type Vec, wrapPhase } from './drive'
import type { Source } from './sim'

export type WaveformAlign = 'emit' | 'arrival'

type WaveformInput = {
  sources: Source[]
  drives: Drive[]
  omega: number
  time: number
  /** 到着基準で揃えるときの基準点 (格子座標)。null なら送出基準のまま描く */
  reference: Vec | null
  align: WaveformAlign
}

// 3 周期あれば位相のずれが山の並びとして読める。それ以上は縦縞が細くなって潰れる
const PERIODS_SHOWN = 3
// 2px ごとに 1 サンプル。正弦波 1 周期が 100px 前後なので折れ線の角は見えない
const SAMPLE_PX = 2
// 隣の行と少し重なる振幅にする (地震計記録の並べ方)。行が薄くても形が読める
const TRACE_OVERLAP = 1.3
const MAX_TRACE_AMP_PX = 14
const LABEL_WIDTH = 40
const ANGLE_TICKS = [0, 90, 180, 270]

const phaseHue = (phase: number) => ((phase / (2 * Math.PI)) * 360 + 360) % 360

/** 描画時に足す位相。到着基準ではターゲットまでの伝搬位相 k·r を引く */
const shiftOf = (
  src: Source,
  reference: Vec | null,
  align: WaveformAlign,
  k: number
) => {
  if (align === 'emit' || reference === null) return 0
  return -k * Math.hypot(src.pos.x - reference.x, src.pos.y - reference.y)
}

const drawAxes = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rowHeight: number,
  count: number
) => {
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '11px sans-serif'
  ctx.textBaseline = 'middle'
  for (const deg of ANGLE_TICKS) {
    const row = Math.round((deg / 360) * count)
    ctx.fillText(`${deg}°`, 4, (row + 0.5) * rowHeight)
  }
  // 右端が「今」。左ほど過去
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.beginPath()
  ctx.moveTo(width - 0.5, 0)
  ctx.lineTo(width - 0.5, height)
  ctx.stroke()
}

export const drawWaveforms = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  input: WaveformInput
) => {
  const { sources, drives, omega, time, reference, align } = input
  ctx.clearRect(0, 0, width, height)
  const count = sources.length
  if (count === 0 || drives.length !== count) return

  const rowHeight = height / count
  const ampPx = Math.min(MAX_TRACE_AMP_PX, (rowHeight / 2) * TRACE_OVERLAP)
  const plotWidth = width - LABEL_WIDTH
  const span = (PERIODS_SHOWN * 2 * Math.PI) / omega
  const samples = Math.ceil(plotWidth / SAMPLE_PX)

  ctx.lineWidth = 1
  sources.forEach((src, j) => {
    const d = drives[j]
    const shift = shiftOf(src, reference, align, omega)
    const baseY = (j + 0.5) * rowHeight
    ctx.strokeStyle = `hsl(${phaseHue(wrapPhase(d.phase + shift)).toFixed(0)}, 85%, 62%)`
    ctx.beginPath()
    for (let s = 0; s <= samples; s++) {
      const x = LABEL_WIDTH + (s / samples) * plotWidth
      const t = time - span * (1 - s / samples)
      const y = baseY - ampPx * d.amp * Math.cos(omega * t + d.phase + shift)
      if (s === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  })
  drawAxes(ctx, width, height, rowHeight, count)
}

type SideInput = {
  sources: Source[]
  drives: Drive[]
  omega: number
  time: number
  reference: Vec | null
  align: WaveformAlign
  /** プール中心の x (格子座標)。これより右にある造波機だけ描く */
  centerX: number
  /** 格子 1 セルあたりの px */
  scale: number
}

// プール右端から波形の描き始めまでの余白。造波機からの引き出し線が見える幅
const SIDE_GAP_PX = 12
// 0° 付近は造波機の縦間隔が広く、±90° 付近は詰まる。詰まった側で隣と重なりすぎない振れ幅
const SIDE_AMP_PX = 7

/**
 * 円の右半分に並ぶ造波機の波形を、プール図の右隣 (x0 から幅 width) に、
 * 各造波機と同じ高さで描く。左端が今で、右へ行くほど過去 (造波機から波が流れ出ていく向き)
 */
export const drawSideWaveforms = (
  ctx: CanvasRenderingContext2D,
  x0: number,
  width: number,
  input: SideInput
) => {
  const { sources, drives, omega, time, reference, align, centerX, scale } =
    input
  if (drives.length !== sources.length) return
  const start = x0 + SIDE_GAP_PX
  const plotWidth = width - SIDE_GAP_PX
  const span = (PERIODS_SHOWN * 2 * Math.PI) / omega
  const samples = Math.ceil(plotWidth / SAMPLE_PX)

  ctx.lineWidth = 1
  sources.forEach((src, j) => {
    if (src.pos.x <= centerX) return
    const d = drives[j]
    const shift = shiftOf(src, reference, align, omega)
    const sx = (src.pos.x + 0.5) * scale
    const baseY = (src.pos.y + 0.5) * scale
    const hue = phaseHue(wrapPhase(d.phase + shift)).toFixed(0)

    ctx.strokeStyle = `hsla(${hue}, 85%, 62%, 0.25)`
    ctx.beginPath()
    ctx.moveTo(sx, baseY)
    ctx.lineTo(start, baseY)
    ctx.stroke()

    ctx.strokeStyle = `hsl(${hue}, 85%, 62%)`
    ctx.beginPath()
    for (let s = 0; s <= samples; s++) {
      const x = start + (s / samples) * plotWidth
      const t = time - span * (s / samples)
      const y =
        baseY - SIDE_AMP_PX * d.amp * Math.cos(omega * t + d.phase + shift)
      if (s === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  })
}
