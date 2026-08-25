export const TAU = Math.PI * 2

// 針は 12 時方向に固定。当選判定・回転量計算はすべてこの角度を基準にする
export const POINTER_ANGLE = -Math.PI / 2

// これ以下だと字が潰れて読めないラベルの下限フォントサイズ (px)。
// 100 件超でも「自分の名前が回っている」ことが見えるのを優先し、間引きはしない
const MIN_LABEL_FONT_PX = 5

const BULBS = 36

export const sectorAngle = (count: number) => TAU / Math.max(count, 1)

export const hueOf = (index: number) =>
  // 黄金角で回すと隣接セクターの色が最大限に離れる
  (index * 137.508) % 360

/** index 番のセクターの中心が針の下に来る回転量 (現在の回転から前方向に最も近い値) */
export const rotationForIndex = (
  index: number,
  count: number,
  from: number,
  extraTurns: number
) => {
  const angle = sectorAngle(count)
  const target = POINTER_ANGLE - (index + 0.5) * angle
  const diff = (((target - from) % TAU) + TAU) % TAU

  return from + diff + extraTurns * TAU
}

export const indexAtPointer = (rotation: number, count: number) => {
  const angle = sectorAngle(count)
  const rel = (((POINTER_ANGLE - rotation) % TAU) + TAU) % TAU

  return Math.min(Math.floor(rel / angle), count - 1)
}

const truncate = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) => {
  if (ctx.measureText(text).width <= maxWidth) return text
  let cut = text

  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) {
    cut = cut.slice(0, -1)
  }

  return `${cut}…`
}

/**
 * セクターとラベルをオフスクリーンに焼く。100 件を毎フレーム描くと
 * メインスレッドが張り付くので、盤面は items 変更時だけ描き直す
 */
export const renderFace = (
  canvas: HTMLCanvasElement,
  size: number,
  items: string[]
) => {
  const ctx = canvas.getContext('2d')

  if (!ctx) return
  const dpr = window.devicePixelRatio || 1

  canvas.width = size * dpr
  canvas.height = size * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const center = size / 2
  const radius = center - size * 0.06
  const angle = sectorAngle(items.length)
  const arcPx = angle * radius * 0.9

  ctx.clearRect(0, 0, size, size)
  ctx.save()
  ctx.translate(center, center)

  items.forEach((item, i) => {
    const start = i * angle

    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, radius, start, start + angle)
    ctx.closePath()
    ctx.fillStyle = `hsl(${hueOf(i)} 85% ${i % 2 === 0 ? 56 : 44}%)`
    ctx.fill()

    if (items.length <= 60) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.lineWidth = Math.max(1, size * 0.002)
      ctx.stroke()
    }

    ctx.save()
    ctx.rotate(start + angle / 2)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    const fontSize = Math.min(
      size * 0.042,
      Math.max(arcPx * 0.82, MIN_LABEL_FONT_PX)
    )

    ctx.font = `${fontSize < 10 ? 500 : 700} ${fontSize}px "Zen Kaku Gothic New", system-ui, sans-serif`
    ctx.fillStyle = '#12021f'
    ctx.fillText(truncate(ctx, item, radius * 0.72), radius * 0.92, 0)
    ctx.restore()
  })

  ctx.restore()
}

type DrawParams = {
  ctx: CanvasRenderingContext2D
  face: HTMLCanvasElement
  size: number
  count: number
  rotation: number
  winnerIndex: number | null
  time: number
}

export const drawWheel = ({
  ctx,
  face,
  size,
  count,
  rotation,
  winnerIndex,
  time,
}: DrawParams) => {
  const center = size / 2
  const radius = center - size * 0.06
  const angle = sectorAngle(count)

  ctx.clearRect(0, 0, size, size)

  // 焼いた盤面を回すだけ (shadowBlur はここでは使わない: 毎フレームでは高すぎる)
  ctx.save()
  ctx.translate(center, center)
  ctx.rotate(rotation)
  ctx.drawImage(face, -center, -center, size, size)

  if (winnerIndex !== null) {
    const start = winnerIndex * angle

    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, radius, start, start + angle)
    ctx.closePath()
    ctx.fillStyle = `rgba(255,255,255,${0.25 + Math.sin(time / 120) * 0.2})`
    ctx.fill()
  }
  ctx.restore()

  ctx.save()
  ctx.translate(center, center)

  // 外周リング
  ctx.strokeStyle = `hsl(${(time * 0.12) % 360} 100% 65%)`
  ctx.lineWidth = size * 0.012
  ctx.beginPath()
  ctx.arc(0, 0, radius + size * 0.026, 0, TAU)
  ctx.stroke()

  // 電飾 (ホイールと一緒には回さず、時間で流す)
  for (let i = 0; i < BULBS; i += 1) {
    const a = (i / BULBS) * TAU
    const on = (Math.sin(time / 120 + i * 0.6) + 1) / 2
    const r = radius + size * 0.026

    ctx.fillStyle = `hsl(${(i * 30 + time * 0.2) % 360} 100% ${45 + on * 45}%)`
    ctx.beginPath()
    ctx.arc(
      Math.cos(a) * r,
      Math.sin(a) * r,
      size * 0.008 + on * size * 0.004,
      0,
      TAU
    )
    ctx.fill()
  }

  // 中央ハブ
  const hub = radius * 0.16
  const grad = ctx.createRadialGradient(0, -hub / 2, hub * 0.1, 0, 0, hub)

  grad.addColorStop(0, '#fff')
  grad.addColorStop(0.5, '#ffd84d')
  grad.addColorStop(1, '#ff2fb3')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(0, 0, hub, 0, TAU)
  ctx.fill()
  ctx.restore()

  // 針
  ctx.save()
  ctx.translate(center, size * 0.012)
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.moveTo(0, size * 0.085)
  ctx.lineTo(-size * 0.035, 0)
  ctx.lineTo(size * 0.035, 0)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}
