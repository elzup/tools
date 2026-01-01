import { Box, Checkbox, FormControlLabel, Paper, Slider, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { Condition, normalCDF, normalPDF, percentileToValue, valueToPercentile } from '../../lib/norm-estimator'

type Props = {
  mean: number
  stdDev: number
  conditions: Condition[]
  lookupMarkers?: { value: number | null; percentile: number | null }
  rawScores?: number[]
  onLookupChange?: (value: number, percentile: number) => void
}

// 細かさレベルの設定（軸とヒストグラム共通）
const DETAIL_LEVELS = [
  { label: '粗い', step: 3, bins: 8 },
  { label: '', step: 1.5, bins: 12 },
  { label: '標準', step: 1, bins: 20 },
  { label: '', step: 0.5, bins: 30 },
  { label: '細かい', step: 0.25, bins: 50 },
]

export function DistributionChart({ mean, stdDev, conditions, lookupMarkers, rawScores, onLookupChange }: Props) {
  const [detailLevel, setDetailLevel] = useState(2) // デフォルトは「標準」
  const [showSigmaRange, setShowSigmaRange] = useState<number[]>([]) // デフォルト非表示

  const axisPoints = useMemo(() => {
    const step = DETAIL_LEVELS[detailLevel].step
    const points: number[] = []
    for (let s = -3; s <= 3; s += step) {
      points.push(Math.round(s * 1000) / 1000) // 浮動小数点誤差対策
    }
    return points
  }, [detailLevel])

  const chartData = useMemo(() => {
    if (!Number.isFinite(mean) || !Number.isFinite(stdDev) || stdDev <= 0) {
      return []
    }
    const points = []
    const step = (6 * stdDev) / 300

    for (let i = mean - 3 * stdDev; i <= mean + 3 * stdDev; i += step) {
      points.push({
        x: i,
        y: normalPDF(i, mean, stdDev),
      })
    }
    return points
  }, [mean, stdDev])

  // ヒストグラム計算（データ数200以下のとき表示）
  const histogramData = useMemo(() => {
    if (!rawScores || rawScores.length === 0 || rawScores.length > 200) {
      return null
    }
    if (!Number.isFinite(mean) || !Number.isFinite(stdDev) || stdDev <= 0) {
      return null
    }

    const minX = mean - 3 * stdDev
    const maxX = mean + 3 * stdDev

    // ビン数をスライダーから取得（細かさレベルと連動）
    const binCount = DETAIL_LEVELS[detailLevel].bins
    const binWidth = (maxX - minX) / binCount

    // 各ビンのカウント
    const bins: { start: number; end: number; count: number }[] = []
    for (let i = 0; i < binCount; i++) {
      bins.push({
        start: minX + i * binWidth,
        end: minX + (i + 1) * binWidth,
        count: 0,
      })
    }

    // データをビンに振り分け
    for (const score of rawScores) {
      const binIndex = Math.floor((score - minX) / binWidth)
      if (binIndex >= 0 && binIndex < binCount) {
        bins[binIndex].count++
      } else if (binIndex === binCount && score === maxX) {
        // 最大値は最後のビンに含める
        bins[binCount - 1].count++
      }
    }

    const totalCount = rawScores.length

    // ビンの境界点（軸表示用）
    const binBoundaries = bins.map(b => b.start).concat([bins[bins.length - 1].end])

    return { bins, binWidth, totalCount, binBoundaries }
  }, [rawScores, mean, stdDev, detailLevel])

  if (chartData.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          正規分布グラフ
        </Typography>
        <Box
          sx={{
            width: '100%',
            height: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.100',
            borderRadius: 1,
          }}
        >
          <Typography color="text.secondary">条件を入力してください</Typography>
        </Box>
      </Paper>
    )
  }

  // 正規分布の最大値（中央の高さ）を基準にする
  const maxY = Math.max(...chartData.map((p) => p.y))
  const minX = mean - 3 * stdDev
  const maxX = mean + 3 * stdDev
  const range = maxX - minX

  const width = 800
  const height = 320
  const paddingX = 25 // 左右余白（端のラベル用）
  const paddingY = 50 // 上下余白（ラベル用）
  const plotWidth = width - 2 * paddingX
  const plotHeight = height - 2 * paddingY

  // 条件の点をマーク
  const conditionMarks = conditions
    .filter((c) => c.value !== undefined && c.percentage !== undefined)
    .map((c) => ({
      x: c.value!,
      label: `${c.value}pt (${c.type === 'value-percentage' ? `top ${c.percentage}%` : `${100 - c.percentage!}%ile`})`,
    }))

  // X座標変換（データ値 → SVG座標）
  const toSvgX = (val: number) => paddingX + ((val - minX) / range) * plotWidth
  // Y座標変換（PDF値 → SVG座標）
  const toSvgY = (pdfVal: number) => height - paddingY - (pdfVal / maxY) * plotHeight

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        正規分布グラフ
      </Typography>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: 'auto', aspectRatio: `${width} / ${height}`, display: 'block' }}
      >
        {/* Grid (ヒストグラムがある場合はビン境界、ない場合はσ基準) */}
        {histogramData ? (
          histogramData.binBoundaries.map((xVal, i) => {
            const xPos = toSvgX(xVal)
            return (
              <line
                key={`grid-bin-${i}`}
                x1={xPos}
                y1={paddingY}
                x2={xPos}
                y2={height - paddingY}
                stroke="#e0e0e0"
                strokeDasharray="4"
                strokeWidth="0.5"
              />
            )
          })
        ) : (
          axisPoints.map((sigma) => {
            const xPos = toSvgX(mean + sigma * stdDev)
            return (
              <line
                key={`grid-${sigma}`}
                x1={xPos}
                y1={paddingY}
                x2={xPos}
                y2={height - paddingY}
                stroke="#e0e0e0"
                strokeDasharray="4"
                strokeWidth="0.5"
              />
            )
          })
        )}

        {/* Axes */}
        <line
          x1={paddingX}
          y1={height - paddingY}
          x2={width - paddingX}
          y2={height - paddingY}
          stroke="#333"
          strokeWidth="2"
        />

        {/* σ range (optional) */}
        {showSigmaRange.includes(3) && (
          <rect
            x={toSvgX(mean - 3 * stdDev)}
            y={paddingY}
            width={toSvgX(mean + 3 * stdDev) - toSvgX(mean - 3 * stdDev)}
            height={plotHeight}
            fill="#2196f3"
            opacity="0.05"
          />
        )}
        {showSigmaRange.includes(2) && (
          <rect
            x={toSvgX(mean - 2 * stdDev)}
            y={paddingY}
            width={toSvgX(mean + 2 * stdDev) - toSvgX(mean - 2 * stdDev)}
            height={plotHeight}
            fill="#2196f3"
            opacity="0.08"
          />
        )}
        {showSigmaRange.includes(1) && (
          <rect
            x={toSvgX(mean - stdDev)}
            y={paddingY}
            width={toSvgX(mean + stdDev) - toSvgX(mean - stdDev)}
            height={plotHeight}
            fill="#2196f3"
            opacity="0.1"
          />
        )}

        {/* Histogram bars - 全サンプルの合計が100%の高さになるように正規化 */}
        {histogramData && histogramData.bins.map((bin, i) => {
          // 全サンプル数を基準に高さを計算（全バーの合計が100%）
          const normalizedHeight = histogramData.totalCount > 0 ? bin.count / histogramData.totalCount : 0
          const barHeight = normalizedHeight * plotHeight
          const barX = toSvgX(bin.start)
          const barWidth = toSvgX(bin.end) - toSvgX(bin.start)
          return (
            <rect
              key={`hist-${i}`}
              x={barX}
              y={height - paddingY - barHeight}
              width={barWidth}
              height={barHeight}
              fill="#4caf50"
              opacity="0.4"
              stroke="#4caf50"
              strokeWidth="1"
            />
          )
        })}

        {/* Distribution curve */}
        <polyline
          points={chartData
            .map((point) => `${toSvgX(point.x)},${toSvgY(point.y)}`)
            .join(' ')}
          fill="none"
          stroke="#1976d2"
          strokeWidth="2"
        />

        {/* Mean line */}
        <line
          x1={toSvgX(mean)}
          y1={paddingY}
          x2={toSvgX(mean)}
          y2={height - paddingY}
          stroke="#f50057"
          strokeWidth="2"
          strokeDasharray="4"
        />

        {/* Condition marks - dashed lines */}
        {conditionMarks.map((mark, i) => {
          const xPos = toSvgX(mark.x)
          if (xPos < 0 || xPos > width) return null
          return (
            <g key={i}>
              <line
                x1={xPos}
                y1={paddingY}
                x2={xPos}
                y2={height - paddingY}
                stroke="#ff9800"
                strokeWidth="2"
                strokeDasharray="6 3"
              />
              <circle cx={xPos} cy={paddingY + 10} r={6} fill="#ff9800" />
            </g>
          )
        })}

        {/* Filled area under curve from lookup to right */}
        {lookupMarkers?.value != null && Number.isFinite(lookupMarkers.value) && (() => {
          const val = lookupMarkers.value
          if (val < minX || val > maxX) return null

          // Filter points from lookup value to the right
          const areaPoints = chartData.filter(p => p.x >= val)
          if (areaPoints.length === 0) return null

          // Build path: start at lookup point on x-axis, follow curve, end at x-axis
          const startX = toSvgX(val)
          const endX = toSvgX(maxX)
          const baseY = height - paddingY

          // Start from bottom, go up to curve at lookup point
          const startY = toSvgY(normalPDF(val, mean, stdDev))

          let pathD = `M ${startX} ${baseY} L ${startX} ${startY}`

          // Follow the curve
          for (const point of areaPoints) {
            pathD += ` L ${toSvgX(point.x)} ${toSvgY(point.y)}`
          }

          // Close path back to x-axis
          pathD += ` L ${endX} ${baseY} Z`

          return (
            <path
              d={pathD}
              fill="#9c27b0"
              opacity="0.15"
            />
          )
        })()}

        {/* Lookup markers (逆引き) */}
        {lookupMarkers?.value != null && Number.isFinite(lookupMarkers.value) && (() => {
          const val = lookupMarkers.value
          const xPos = toSvgX(val)
          if (xPos < 0 || xPos > width) return null
          return (
            <g>
              <line
                x1={xPos}
                y1={paddingY}
                x2={xPos}
                y2={height - paddingY}
                stroke="#9c27b0"
                strokeWidth="2"
              />
              <circle cx={xPos} cy={paddingY + 10} r={5} fill="#9c27b0" />
            </g>
          )
        })()}

        {/* X axis labels - value (ヒストグラムがある場合はビン境界、ない場合はσ基準) */}
        {histogramData ? (
          // ビン境界を表示（間引き: ビン数に応じて）
          histogramData.binBoundaries
            .filter((_, i) => {
              const binCount = histogramData.bins.length
              // ビン数が多い場合は間引く
              if (binCount <= 12) return true
              if (binCount <= 20) return i % 2 === 0
              if (binCount <= 30) return i % 3 === 0
              return i % 5 === 0
            })
            .map((xVal, i) => {
              const xPos = toSvgX(xVal)
              return (
                <text
                  key={`bin-${i}`}
                  x={xPos}
                  y={height - paddingY + 18}
                  textAnchor="middle"
                  fontSize={detailLevel >= 3 ? '9' : '11'}
                  fill="#666"
                >
                  {xVal.toFixed(detailLevel >= 3 ? 1 : 0)}
                </text>
              )
            })
        ) : (
          axisPoints.map((sigma) => {
            const xVal = mean + sigma * stdDev
            const xPos = toSvgX(xVal)
            return (
              <text
                key={sigma}
                x={xPos}
                y={height - paddingY + 18}
                textAnchor="middle"
                fontSize={detailLevel >= 3 ? '9' : '11'}
                fill="#666"
              >
                {xVal.toFixed(detailLevel >= 4 ? 1 : 0)}
              </text>
            )
          })
        )}

        {/* X axis labels - top % (ヒストグラムがある場合はビン境界、ない場合はσ基準) */}
        {histogramData ? (
          histogramData.binBoundaries
            .filter((_, i) => {
              const binCount = histogramData.bins.length
              if (binCount <= 12) return true
              if (binCount <= 20) return i % 2 === 0
              if (binCount <= 30) return i % 3 === 0
              return i % 5 === 0
            })
            .map((xVal, i) => {
              const xPos = toSvgX(xVal)
              const zScore = (xVal - mean) / stdDev
              const topPercent = (1 - normalCDF(zScore)) * 100
              return (
                <text
                  key={`bin-top-${i}`}
                  x={xPos}
                  y={height - paddingY + 32}
                  textAnchor="middle"
                  fontSize={detailLevel >= 3 ? '7' : '9'}
                  fill="#999"
                >
                  {topPercent < 1
                    ? `${topPercent.toFixed(1)}%`
                    : topPercent < 10
                      ? `${topPercent.toFixed(1)}%`
                      : `${topPercent.toFixed(0)}%`}
                </text>
              )
            })
        ) : (
          axisPoints.map((sigma) => {
            const xPos = toSvgX(mean + sigma * stdDev)
            const topPercent = (1 - normalCDF(sigma)) * 100
            return (
              <text
                key={`top-${sigma}`}
                x={xPos}
                y={height - paddingY + 32}
                textAnchor="middle"
                fontSize={detailLevel >= 3 ? '7' : '9'}
                fill="#999"
              >
                {topPercent < 1
                  ? `${topPercent.toFixed(1)}%`
                  : topPercent < 10
                    ? `${topPercent.toFixed(1)}%`
                    : `${topPercent.toFixed(0)}%`}
              </text>
            )
          })
        )}
      </svg>

      {/* Lookup slider - same padding ratio as graph */}
      {onLookupChange && (
        <Box sx={{
          // グラフと同じ余白比率 (paddingX / width = 25/800 = 3.125%)
          width: `${(plotWidth / width) * 100}%`,
          mx: 'auto',
          mt: -1,
        }}>
          <Slider
            value={lookupMarkers?.value ?? mean}
            onChange={(_e: Event, v: number | number[]) => {
              const val = v as number
              const pct = valueToPercentile(val, mean, stdDev)
              const topPct = 100 - pct
              onLookupChange(val, topPct)
            }}
            min={minX}
            max={maxX}
            step={(maxX - minX) / 1000}
            size="small"
            sx={{
              color: '#9c27b0',
              '& .MuiSlider-thumb': {
                width: 14,
                height: 14,
              },
              '& .MuiSlider-rail': {
                opacity: 0.3,
              },
            }}
          />
        </Box>
      )}

      <Stack
        direction="row"
        spacing={2}
        sx={{ mt: 1 }}
        alignItems="center"
        flexWrap="wrap"
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 24, height: 2, bgcolor: 'primary.main' }} />
          <Typography variant="body2">正規分布</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 24, height: 2, borderTop: '2px dashed #f50057' }} />
          <Typography variant="body2">平均値</Typography>
        </Stack>
        {/* σ範囲チェックボックス */}
        <Stack direction="row" spacing={0} alignItems="center">
          {[1, 2, 3].map((n) => (
            <FormControlLabel
              key={n}
              control={
                <Checkbox
                  size="small"
                  checked={showSigmaRange.includes(n)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setShowSigmaRange([...showSigmaRange, n].sort())
                    } else {
                      setShowSigmaRange(showSigmaRange.filter(v => v !== n))
                    }
                  }}
                  sx={{ p: 0.5 }}
                />
              }
              label={<Typography variant="caption">{n}σ</Typography>}
              sx={{ mr: 0.5 }}
            />
          ))}
        </Stack>
        {conditionMarks.length > 0 && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 24, height: 2, borderTop: '2px dashed #ff9800' }} />
            <Typography variant="body2">条件</Typography>
          </Stack>
        )}
        {histogramData && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 16,
                height: 16,
                bgcolor: 'rgba(76, 175, 80, 0.4)',
                border: '1px solid #4caf50',
              }}
            />
            <Typography variant="body2">データ分布 (n={histogramData.totalCount})</Typography>
          </Stack>
        )}
        {(lookupMarkers?.value !== null || lookupMarkers?.percentile !== null) && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 24, height: 2, bgcolor: '#9c27b0' }} />
            <Typography variant="body2">逆引き</Typography>
          </Stack>
        )}

        <Box sx={{ flex: 1 }} />

        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 150 }}>
          <Typography variant="caption" color="text.secondary">
            細かさ
          </Typography>
          <Slider
            value={detailLevel}
            onChange={(_e: Event, v: number | number[]) => setDetailLevel(v as number)}
            min={0}
            max={4}
            step={1}
            marks={DETAIL_LEVELS.map((l, i) => ({ value: i, label: l.label }))}
            size="small"
            sx={{ width: 120 }}
          />
        </Stack>
      </Stack>
    </Paper>
  )
}
