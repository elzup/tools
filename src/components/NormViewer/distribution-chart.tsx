import { Box, Paper, Slider, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { Condition, normalCDF, normalPDF, percentileToValue } from '../../lib/norm-estimator'

// 軸分割レベルの設定
const AXIS_LEVELS = [
  { label: '粗い', step: 3 },      // -3, 0, 3
  { label: '', step: 1.5 },        // -3, -1.5, 0, 1.5, 3
  { label: '標準', step: 1 },      // -3, -2, -1, 0, 1, 2, 3
  { label: '', step: 0.5 },        // every 0.5σ
  { label: '細かい', step: 0.25 }, // every 0.25σ
]

type Props = {
  mean: number
  stdDev: number
  conditions: Condition[]
  lookupMarkers?: { value: number | null; percentile: number | null }
}

export function DistributionChart({ mean, stdDev, conditions, lookupMarkers }: Props) {
  const [axisLevel, setAxisLevel] = useState(2) // デフォルトは「標準」

  const axisPoints = useMemo(() => {
    const step = AXIS_LEVELS[axisLevel].step
    const points: number[] = []
    for (let s = -3; s <= 3; s += step) {
      points.push(Math.round(s * 1000) / 1000) // 浮動小数点誤差対策
    }
    return points
  }, [axisLevel])

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

  const maxY = Math.max(...chartData.map((p) => p.y))
  const minX = mean - 3 * stdDev
  const maxX = mean + 3 * stdDev
  const range = maxX - minX

  const width = 800
  const height = 320
  const padding = 50

  // 条件の点をマーク
  const conditionMarks = conditions
    .filter((c) => c.value !== undefined && c.percentage !== undefined)
    .map((c) => ({
      x: c.value!,
      label: `${c.value}pt (${c.type === 'value-percentage' ? `top ${c.percentage}%` : `${100 - c.percentage!}%ile`})`,
    }))

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        正規分布グラフ
      </Typography>

      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ maxWidth: '100%' }}
      >
        {/* Grid */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`grid-${i}`}
            x1={padding + (i * (width - 2 * padding)) / 4}
            y1={padding}
            x2={padding + (i * (width - 2 * padding)) / 4}
            y2={height - padding}
            stroke="#e0e0e0"
            strokeDasharray="4"
            strokeWidth="0.5"
          />
        ))}

        {/* Axes */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#333"
          strokeWidth="2"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#333"
          strokeWidth="2"
        />

        {/* 1σ range */}
        <rect
          x={padding + ((mean - stdDev - minX) / range) * (width - 2 * padding)}
          y={padding}
          width={((2 * stdDev) / range) * (width - 2 * padding)}
          height={height - 2 * padding}
          fill="#2196f3"
          opacity="0.1"
        />

        {/* Distribution curve */}
        <polyline
          points={chartData
            .map((point) => {
              const x =
                padding + ((point.x - minX) / range) * (width - 2 * padding)
              const y =
                height - padding - (point.y / maxY) * (height - 2 * padding)
              return `${x},${y}`
            })
            .join(' ')}
          fill="none"
          stroke="#1976d2"
          strokeWidth="2"
        />

        {/* Mean line */}
        <line
          x1={padding + ((mean - minX) / range) * (width - 2 * padding)}
          y1={padding}
          x2={padding + ((mean - minX) / range) * (width - 2 * padding)}
          y2={height - padding}
          stroke="#f50057"
          strokeWidth="2"
          strokeDasharray="4"
        />

        {/* Condition marks */}
        {conditionMarks.map((mark, i) => {
          const xPos =
            padding + ((mark.x - minX) / range) * (width - 2 * padding)
          if (xPos < padding || xPos > width - padding) return null
          return (
            <g key={i}>
              <line
                x1={xPos}
                y1={padding}
                x2={xPos}
                y2={height - padding}
                stroke="#ff9800"
                strokeWidth="2"
              />
              <circle cx={xPos} cy={padding + 10} r={6} fill="#ff9800" />
            </g>
          )
        })}

        {/* Lookup markers (逆引き) */}
        {lookupMarkers?.value != null && Number.isFinite(lookupMarkers.value) && (() => {
          const val = lookupMarkers.value
          const xPos = padding + ((val - minX) / range) * (width - 2 * padding)
          if (xPos < padding || xPos > width - padding) return null
          return (
            <g>
              <line
                x1={xPos}
                y1={padding}
                x2={xPos}
                y2={height - padding}
                stroke="#9c27b0"
                strokeWidth="2"
                strokeDasharray="6 3"
              />
              <circle cx={xPos} cy={padding + 10} r={5} fill="#9c27b0" />
            </g>
          )
        })()}
        {lookupMarkers?.percentile != null && Number.isFinite(lookupMarkers.percentile) && (() => {
          const pct = lookupMarkers.percentile
          const valueFromPct = percentileToValue(pct, mean, stdDev)
          const xPos = padding + ((valueFromPct - minX) / range) * (width - 2 * padding)
          if (xPos < padding || xPos > width - padding) return null
          return (
            <g>
              <line
                x1={xPos}
                y1={padding}
                x2={xPos}
                y2={height - padding}
                stroke="#00bcd4"
                strokeWidth="2"
                strokeDasharray="6 3"
              />
              <circle cx={xPos} cy={padding + 10} r={5} fill="#00bcd4" />
            </g>
          )
        })()}

        {/* X axis labels - value */}
        {axisPoints.map((sigma) => {
          const xVal = mean + sigma * stdDev
          const xPos =
            padding + ((xVal - minX) / range) * (width - 2 * padding)
          return (
            <text
              key={sigma}
              x={xPos}
              y={height - padding + 18}
              textAnchor="middle"
              fontSize={axisLevel >= 3 ? '9' : '11'}
              fill="#666"
            >
              {xVal.toFixed(axisLevel >= 4 ? 1 : 0)}
            </text>
          )
        })}

        {/* X axis labels - top % */}
        {axisPoints.map((sigma) => {
          const xPos =
            padding + ((mean + sigma * stdDev - minX) / range) * (width - 2 * padding)
          const topPercent = (1 - normalCDF(sigma)) * 100
          return (
            <text
              key={`top-${sigma}`}
              x={xPos}
              y={height - padding + 32}
              textAnchor="middle"
              fontSize={axisLevel >= 3 ? '7' : '9'}
              fill="#999"
            >
              {topPercent < 1
                ? `${topPercent.toFixed(1)}%`
                : topPercent < 10
                  ? `${topPercent.toFixed(1)}%`
                  : `${topPercent.toFixed(0)}%`}
            </text>
          )
        })}
      </svg>

      <Stack
        direction="row"
        spacing={2}
        sx={{ mt: 2 }}
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
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 16,
              height: 16,
              bgcolor: 'rgba(33, 150, 243, 0.1)',
              border: '1px solid #2196f3',
            }}
          />
          <Typography variant="body2">±σ範囲</Typography>
        </Stack>
        {conditionMarks.length > 0 && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 24, height: 2, bgcolor: '#ff9800' }} />
            <Typography variant="body2">条件</Typography>
          </Stack>
        )}
        {(lookupMarkers?.value !== null || lookupMarkers?.percentile !== null) && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 24, height: 2, borderTop: '2px dashed #9c27b0' }} />
            <Typography variant="body2">逆引き</Typography>
          </Stack>
        )}

        <Box sx={{ flex: 1 }} />

        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 150 }}>
          <Typography variant="caption" color="text.secondary">
            軸
          </Typography>
          <Slider
            value={axisLevel}
            onChange={(_e: Event, v: number | number[]) => setAxisLevel(v as number)}
            min={0}
            max={4}
            step={1}
            marks={AXIS_LEVELS.map((l, i) => ({ value: i, label: l.label }))}
            size="small"
            sx={{ width: 120 }}
          />
        </Stack>
      </Stack>
    </Paper>
  )
}
