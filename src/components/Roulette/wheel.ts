export const TAU = Math.PI * 2

// 針は 12 時方向に固定。当選判定・回転量計算はすべてこの角度を基準にする
export const POINTER_ANGLE = -Math.PI / 2

// セクターが細すぎるとラベルが潰れて読めないので、円弧長がこの px を
// 下回る場合はホイール上のラベル描画を諦める (100 件超の入力で発生する)
const MIN_LABEL_ARC_PX = 13

export const sectorAngle = (count: number) => TAU / Math.max(count, 1)

export const hueOf = (index: number) =>
  // 黄金角で回すと隣接セクターの色が最大限に離れる
  (index * 137.508) % 360

/** index 番のセクターの中心が針の下に来る回転量 (現在の回転に最も近い値) */
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

type DrawParams = {
  ctx: CanvasRenderingContext2D
  size: number
  items: string[]
  rotation: number
  winnerIndex: number | null
  time: number
}

export const drawWheel = ({
  ctx,
  size,
  items,
  rotation,
  winnerIndex,
  time,
}: DrawParams) => {
  const center = size / 2
  const radius = center - size * 0.06
  const angle = sectorAngle(items.length)
  const arcPx = angle * radius * 0.9
  const showLabels = arcPx >= MIN_LABEL_ARC_PX

  ctx.clearRect(0, 0, size, size)
  ctx.save()
  ctx.translate(center, center)

  // 外周のネオン光。回転中は強く光らせて「回ってる感」を出す
  ctx.save()
  ctx.shadowBlur = size * 0.06
  ctx.shadowColor = `hsl(${(time * 0.12) % 360} 100% 60%)`
  ctx.strokeStyle = `hsl(${(time * 0.12) % 360} 100% 65%)`
  ctx.lineWidth = size * 0.012
  ctx.beginPath()
  ctx.arc(0, 0, radius + size * 0.026, 0, TAU)
  ctx.stroke()
  ctx.restore()

  ctx.rotate(rotation)

  items.forEach((item, i) => {
    const start = i * angle
    const isWinner = winnerIndex === i
    const light = isWinner ? 72 : i % 2 === 0 ? 56 : 44

    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, radius, start, start + angle)
    ctx.closePath()
    ctx.fillStyle = isWinner
      ? `hsl(${hueOf(i)} 100% ${light + Math.sin(time / 90) * 12}%)`
      : `hsl(${hueOf(i)} 85% ${light}%)`
    ctx.fill()

    if (items.length <= 60) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.lineWidth = Math.max(1, size * 0.002)
      ctx.stroke()
    }

    if (!showLabels) return

    ctx.save()
    ctx.rotate(start + angle / 2)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    const fontSize = Math.min(size * 0.042, Math.max(arcPx * 0.78, 9))

    ctx.font = `700 ${fontSize}px "Zen Kaku Gothic New", system-ui, sans-serif`
    ctx.fillStyle = '#12021f'
    ctx.shadowBlur = 4
    ctx.shadowColor = 'rgba(255,255,255,0.8)'
    ctx.fillText(truncate(ctx, item, radius * 0.72), radius * 0.92, 0)
    ctx.restore()
  })

  ctx.restore()

  // 中央ハブ
  ctx.save()
  ctx.translate(center, center)
  const hub = radius * 0.16
  const grad = ctx.createRadialGradient(0, -hub / 2, hub * 0.1, 0, 0, hub)

  grad.addColorStop(0, '#fff')
  grad.addColorStop(0.5, '#ffd84d')
  grad.addColorStop(1, '#ff2fb3')
  ctx.fillStyle = grad
  ctx.shadowBlur = size * 0.05
  ctx.shadowColor = '#ff2fb3'
  ctx.beginPath()
  ctx.arc(0, 0, hub, 0, TAU)
  ctx.fill()
  ctx.restore()

  // 電飾 (ホイールと一緒に回さず、時間で流れる)
  const bulbs = 36

  for (let i = 0; i < bulbs; i += 1) {
    const a = (i / bulbs) * TAU
    const on = (Math.sin(time / 120 + i * 0.6) + 1) / 2

    ctx.save()
    ctx.translate(
      center + Math.cos(a) * (radius + size * 0.026),
      center + Math.sin(a) * (radius + size * 0.026)
    )
    ctx.fillStyle = `hsl(${(i * 30 + time * 0.2) % 360} 100% ${45 + on * 45}%)`
    ctx.shadowBlur = size * 0.02 * on
    ctx.shadowColor = ctx.fillStyle
    ctx.beginPath()
    ctx.arc(0, 0, size * 0.008 + on * size * 0.004, 0, TAU)
    ctx.fill()
    ctx.restore()
  }

  // 針
  ctx.save()
  ctx.translate(center, size * 0.012)
  ctx.fillStyle = '#fff'
  ctx.shadowBlur = size * 0.04
  ctx.shadowColor = '#00e5ff'
  ctx.beginPath()
  ctx.moveTo(0, size * 0.085)
  ctx.lineTo(-size * 0.035, 0)
  ctx.lineTo(size * 0.035, 0)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}
