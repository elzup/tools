import { Box, Typography } from '@mui/material'

type Params = {
  naturalRecoveryPerHour: number
  naturalRecoveryCap: number
  relicGenerationPer10h: number
  staminaCap: number
  shopCandy: number
  stoneRefill: number
  eventCost: number
  dailyQuestCost: number
  morningConsume: number
}

const COLORS = {
  existing: '#c62828',          // 既存キャンディ (暗い赤)
  naturalRecovery: '#66bb6a',   // 自然回復 (緑)
  shopCandy: '#ffa726',         // ショップ (オレンジ)
  stoneRefill: '#42a5f5',       // 石割りx3 (青)
  relicCollection: '#ab47bc',   // 世界樹聖物→キャンディ (紫)
  relic: '#388e3c',             // 世界樹聖物蓄積 (濃い緑)
  relicNatural: '#81c784',      // 世界樹聖物 自然回復分 (明るい緑)
  stock: '#e53935',             // 貯蓄飴 オーバーフロー分 (赤)
  consumeEvent: '#5c6bc0',      // イベント消化 (インディゴ)
  consumeDaily: '#7986cb',      // デイリーノルマ (薄インディゴ)
  consumeTraining: '#9fa8da',   // 育成消化 (さらに薄インディゴ)
} as const

const LEGEND_ITEMS: { color: string; label: string; isStock?: boolean }[] = [
  { color: COLORS.existing, label: '既存キャンディ' },
  { color: COLORS.naturalRecovery, label: '自然回復' },
  { color: COLORS.shopCandy, label: 'ショップ' },
  { color: COLORS.stoneRefill, label: '石割りx3' },
  { color: COLORS.relicCollection, label: '世界樹聖物→キャンディ' },
  { color: COLORS.stock, label: '貯蓄飴', isStock: true },
  { color: COLORS.consumeEvent, label: 'イベント消化' },
  { color: COLORS.consumeDaily, label: 'デイリーノルマ' },
  { color: COLORS.consumeTraining, label: '育成消化' },
  { color: COLORS.relic, label: '世界樹聖物 既存' },
  { color: COLORS.relicNatural, label: '世界樹聖物 増分' },
]

// 積み上げの1セグメント
type Segment = { value: number; color: string }

type HourData = {
  hour: number
  staminaStack: Segment[] // 上方向: キャンディ→世界樹聖物
  consumedTotal: number // 累計消費
  stockAmount: number
  relicToCandy: number    // 世界樹聖物→キャンディ変換量 (=貯蓄飴の対称分)
  relicExisting: number   // 世界樹聖物 既存分
  relicDelta: number      // 世界樹聖物 この時間の増分
}

function buildHourlyData(params: Params): HourData[] {
  const data: HourData[] = []

  let existing = 0
  let natural = 0
  let shop = 0
  let stone = 0
  let relicStamina = 0
  let relicToCandyAmt = 0
  let stock = 0
  let consumedTotal = 0

  const getTotal = () => existing + natural + shop + stone + relicStamina

  const consume = (amount: number) => {
    const total = getTotal()
    if (total <= 0) return
    consumedTotal += Math.min(amount, total)
    const remaining = Math.max(0, total - amount)
    existing = remaining
    natural = 0
    shop = 0
    stone = 0
    relicStamina = 0
  }

  const fadeToExisting = () => {
    existing = getTotal()
    natural = 0
    shop = 0
    stone = 0
    relicStamina = 0
  }

  const makeStack = (): Segment[] => {
    const segs: Segment[] = []
    if (existing > 0) segs.push({ value: existing, color: COLORS.existing })
    if (natural > 0) segs.push({ value: natural, color: COLORS.naturalRecovery })
    if (shop > 0) segs.push({ value: shop, color: COLORS.shopCandy })
    if (stone > 0) segs.push({ value: stone, color: COLORS.stoneRefill })
    if (relicStamina > 0) segs.push({ value: relicStamina, color: COLORS.relicCollection })
    return segs
  }

  // 世界樹聖物: 前日18時からの引き継ぎ (6h分)
  const relicCarryOver = Math.floor((params.relicGenerationPer10h / 10) * 6)
  const relicPerHour = params.relicGenerationPer10h / 10

  for (let h = 0; h <= 23; h++) {
    if (h > 0) {
      fadeToExisting()

      const current = getTotal()
      const canRecover = Math.max(0, params.naturalRecoveryCap - current)
      const recovery = Math.min(params.naturalRecoveryPerHour, canRecover)
      natural = recovery
    }

    // 09:00 育成消化
    if (h === 9) {
      consume(params.morningConsume)
    }

    // 18:00 イベント
    if (h === 18) {
      if (getTotal() + params.shopCandy > params.staminaCap) {
        stock += params.shopCandy
      } else {
        shop = params.shopCandy
      }

      if (getTotal() + params.stoneRefill > params.staminaCap) {
        stock += params.stoneRefill
      } else {
        stone = params.stoneRefill
      }

      // 世界樹聖物回収 (carry over + 18h分)
      const relicAmt = relicCarryOver + Math.floor(relicPerHour * 18)
      if (getTotal() + relicAmt > params.staminaCap) {
        stock += relicAmt
        relicToCandyAmt = 0
      } else {
        relicStamina = relicAmt
        relicToCandyAmt = relicAmt
      }

    }

    // 世界樹聖物蓄積量: 既存(前時間まで)と自然回復分(この1時間の増分)
    let relicExisting = 0
    let relicDelta = 0
    if (h < 18) {
      const totalRelic = relicCarryOver + Math.floor(relicPerHour * h)
      const prevRelic = h > 0 ? relicCarryOver + Math.floor(relicPerHour * (h - 1)) : relicCarryOver
      relicExisting = prevRelic
      relicDelta = totalRelic - prevRelic
    } else {
      // 18時に回収済み → 再蓄積
      const hoursSince18 = h - 18
      const totalRelic = Math.floor(relicPerHour * hoursSince18)
      const prevRelic = hoursSince18 > 0 ? Math.floor(relicPerHour * (hoursSince18 - 1)) : 0
      relicExisting = prevRelic
      relicDelta = totalRelic - prevRelic
    }

    // h=18, h=23: 受取内容を描画してから消費
    // 上方向バー=受取後の状態、下方向バー=消費済み量(消費を先に加算)
    if (h === 18 || h === 23) {
      const willConsume = getTotal()
      consumedTotal += willConsume

      data.push({
        hour: h,
        staminaStack: makeStack(),
        consumedTotal,
        stockAmount: stock,
        relicToCandy: relicToCandyAmt,
        relicExisting,
        relicDelta,
      })

      // 消費後: キャンディをゼロに
      existing = 0
      natural = 0
      shop = 0
      stone = 0
      relicStamina = 0
    } else {
      data.push({
        hour: h,
        staminaStack: makeStack(),
        consumedTotal,
        stockAmount: stock,
        relicToCandy: relicToCandyAmt,
        relicExisting,
        relicDelta,
      })
    }
  }

  return data
}

const SVG_WIDTH = 840
const SVG_HEIGHT = 420
const MARGIN = { top: 20, right: 30, bottom: 56, left: 50 }
const CHART_W = SVG_WIDTH - MARGIN.left - MARGIN.right
const CHART_H = SVG_HEIGHT - MARGIN.top - MARGIN.bottom

type Props = { params: Params }

const StaminaChart = ({ params }: Props) => {
  const hourlyData = buildHourlyData(params)

  // 上方向最大値 (キャンディ+世界樹聖物の合計)
  const maxUp = Math.max(
    ...hourlyData.map((d) =>
      d.staminaStack.reduce((s, seg) => s + seg.value, 0) + d.relicExisting + d.relicDelta
    ),
    params.staminaCap,
    1
  )
  // 下方向最大値 (消費 + 貯蓄飴)
  const maxDown = Math.max(
    ...hourlyData.map((d) => d.consumedTotal + d.stockAmount),
    1
  )

  const totalRange = maxUp + maxDown
  const zeroRatio = maxUp / totalRange
  const zeroY = MARGIN.top + CHART_H * zeroRatio
  const pxPerUnit = CHART_H / totalRange

  const groupW = CHART_W / 24
  const barW = Math.min(groupW * 0.7, 22)

  // グリッド
  const gridStep = calcGridStep(maxUp)
  const upGrids = buildGridValues(maxUp, gridStep)
  const downGrids = buildGridValues(maxDown, calcGridStep(maxDown))

  return (
    <Box>
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        width="100%"
        style={{ maxWidth: SVG_WIDTH }}
      >
        <defs>
          {/* 貯蓄飴用の斜線パターン */}
          <pattern id="stockPattern" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill={COLORS.stock} />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#fff" strokeWidth="2" opacity="0.3" />
          </pattern>
        </defs>
        {/* グリッド上 */}
        {upGrids.map((v) => {
          const y = zeroY - v * pxPerUnit
          return (
            <g key={`u${v}`}>
              <line
                x1={MARGIN.left} x2={SVG_WIDTH - MARGIN.right}
                y1={y} y2={y}
                stroke="#555" strokeWidth={0.5} strokeDasharray="4,4"
              />
              <text x={MARGIN.left - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#888">
                {v}
              </text>
            </g>
          )
        })}

        {/* グリッド下 */}
        {downGrids.map((v) => {
          const y = zeroY + v * pxPerUnit
          return (
            <g key={`d${v}`}>
              <line
                x1={MARGIN.left} x2={SVG_WIDTH - MARGIN.right}
                y1={y} y2={y}
                stroke="#555" strokeWidth={0.5} strokeDasharray="4,4"
              />
              <text x={MARGIN.left - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#888">
                -{v}
              </text>
            </g>
          )
        })}

        {/* キャンディ上限ライン */}
        <line
          x1={MARGIN.left} x2={SVG_WIDTH - MARGIN.right}
          y1={zeroY - params.staminaCap * pxPerUnit}
          y2={zeroY - params.staminaCap * pxPerUnit}
          stroke="#ef5350" strokeWidth={1.5} strokeDasharray="6,3" opacity={0.6}
        />
        <text
          x={MARGIN.left - 6}
          y={zeroY - params.staminaCap * pxPerUnit + 4}
          textAnchor="end" fontSize={8} fill="#ef5350"
        >
          {params.staminaCap}
        </text>
        <text
          x={SVG_WIDTH - MARGIN.right + 2}
          y={zeroY - params.staminaCap * pxPerUnit + 4}
          fontSize={8} fill="#ef5350"
        >
          {params.staminaCap}
        </text>

        {/* 自然回復上限ライン */}
        <line
          x1={MARGIN.left} x2={SVG_WIDTH - MARGIN.right}
          y1={zeroY - params.naturalRecoveryCap * pxPerUnit}
          y2={zeroY - params.naturalRecoveryCap * pxPerUnit}
          stroke="#66bb6a" strokeWidth={1} strokeDasharray="4,4" opacity={0.5}
        />
        <text
          x={SVG_WIDTH - MARGIN.right + 2}
          y={zeroY - params.naturalRecoveryCap * pxPerUnit + 4}
          fontSize={8} fill="#66bb6a"
        >
          {params.naturalRecoveryCap}
        </text>

        {/* ゼロライン */}
        <line
          x1={MARGIN.left} x2={SVG_WIDTH - MARGIN.right}
          y1={zeroY} y2={zeroY}
          stroke="#aaa" strokeWidth={1}
        />

        {/* 24時間バー (1本: キャンディ下→世界樹聖物上) */}
        {hourlyData.map((d, i) => {
          const cx = MARGIN.left + groupW * (i + 0.5)
          const barX = cx - barW / 2

          // 上方向: キャンディ積み上げ → 世界樹聖物
          let offset = 0
          const stRects = d.staminaStack.map((seg, j) => {
            const h = seg.value * pxPerUnit
            const y = zeroY - offset - h
            offset += h
            return (
              <rect
                key={`s${j}`}
                x={barX} y={y} width={barW} height={h}
                fill={seg.color} rx={1}
              />
            )
          })

          // 世界樹聖物をキャンディの上に積む (既存分 + この時間の増分)
          const relicRects: JSX.Element[] = []
          if (d.relicExisting > 0) {
            const h = d.relicExisting * pxPerUnit
            relicRects.push(
              <rect
                key="relic-existing"
                x={barX} y={zeroY - offset - h} width={barW} height={h}
                fill={COLORS.relic} rx={1} opacity={0.85}
              />
            )
            offset += h
          }
          if (d.relicDelta > 0) {
            const h = d.relicDelta * pxPerUnit
            relicRects.push(
              <rect
                key="relic-delta"
                x={barX} y={zeroY - offset - h} width={barW} height={h}
                fill={COLORS.relicNatural} rx={1} opacity={0.85}
              />
            )
            offset += h
          }

          // 下方向: 消費内訳 (イベント→デイリー→貯蓄飴→育成) + オーバーフロー
          let downOffset = 0
          const eventAmt = Math.min(d.consumedTotal, params.eventCost)
          const dailyAmt = Math.min(Math.max(0, d.consumedTotal - eventAmt), params.dailyQuestCost)
          const trainingTotal = Math.max(0, d.consumedTotal - eventAmt - dailyAmt)
          // 育成の中から貯蓄飴分を分離 (世界樹聖物→キャンディ変換と対称)
          const stockInTraining = Math.min(trainingTotal, d.relicToCandy)
          const pureTraining = trainingTotal - stockInTraining

          const consumeSegs: Segment[] = [
            { value: eventAmt, color: COLORS.consumeEvent },
            { value: dailyAmt, color: COLORS.consumeDaily },
            { value: pureTraining, color: COLORS.consumeTraining },
            { value: stockInTraining, color: 'url(#stockPattern)' },
          ]

          const consumeRects = consumeSegs.map((seg, j) => {
            if (seg.value <= 0) return null
            const h = seg.value * pxPerUnit
            const y = zeroY + downOffset
            downOffset += h
            return (
              <rect
                key={`c${j}`}
                x={barX} y={y} width={barW} height={h}
                fill={seg.color} rx={1}
              />
            )
          })

          const stockH = d.stockAmount * pxPerUnit
          const stockRect = d.stockAmount > 0 ? (() => {
            const y = zeroY + downOffset
            return (
              <rect
                key="stock"
                x={barX} y={y} width={barW} height={stockH}
                fill="url(#stockPattern)" rx={1}
              />
            )
          })() : null

          return (
            <g key={i}>
              {stRects}
              {relicRects}
              {consumeRects}
              {stockRect}
              {/* 時刻 */}
              <text
                x={cx} y={zeroY + maxDown * pxPerUnit + 14}
                textAnchor="middle" fontSize={9} fill="#aaa"
              >
                {d.hour}
              </text>
            </g>
          )
        })}

        {/* イベントマーカー */}
        {[
          { hour: 9, label: '朝消化', color: COLORS.consumeTraining },
          { hour: 18, label: '回収+消化', color: COLORS.relicCollection },
          { hour: 23, label: '消化', color: COLORS.consumeEvent },
        ].map(({ hour, label, color }) => (
          <text
            key={hour}
            x={MARGIN.left + groupW * (hour + 0.5)}
            y={zeroY + maxDown * pxPerUnit + 28}
            textAnchor="middle" fontSize={7} fill={color} fontWeight="bold"
          >
            {label}
          </text>
        ))}

        {/* 軸ラベル */}
        <text
          x={MARGIN.left + CHART_W / 2}
          y={SVG_HEIGHT - 2}
          textAnchor="middle" fontSize={10} fill="#888"
        >
          時刻 (h)
        </text>
      </svg>

      {/* 凡例 */}
      <Box display="flex" gap={1.5} flexWrap="wrap" mt={1}>
        {LEGEND_ITEMS.map((item) => (
          <Box key={item.label} display="flex" alignItems="center" gap={0.5}>
            <Box
              sx={{
                width: 12, height: 12,
                backgroundColor: item.color,
                borderRadius: '2px',
                ...(item.isStock && {
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 2px,
                    rgba(255,255,255,0.3) 2px,
                    rgba(255,255,255,0.3) 4px
                  )`,
                }),
              }}
            />
            <Typography variant="caption">{item.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

function calcGridStep(max: number): number {
  if (max <= 200) return 50
  if (max <= 500) return 100
  if (max <= 1500) return 200
  return 500
}

function buildGridValues(max: number, step: number): number[] {
  const values: number[] = []
  for (let v = step; v <= max; v += step) {
    values.push(v)
  }
  return values
}

export default StaminaChart
