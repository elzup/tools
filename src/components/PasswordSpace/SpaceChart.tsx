import { useTheme } from '@mui/material'
import styled from 'styled-components'

import {
  type ColorMap,
  type Params,
  SERIES,
  boxCox,
  pickDecadeTicks,
  sup,
} from './space'

type Props = {
  params: Params
  lambda: number
  colors: ColorMap
  lMin: number
  lMax: number
  onSelectLength: (length: number) => void
}

const W = 760
const H = 340
const PAD = { left: 64, right: 16, top: 14, bottom: 34 }
// 目盛りが重ならない最小の縦間隔 (px, viewBox 座標)
const MIN_TICK_GAP = 18

export const SpaceChart = (p: Props) => {
  const { palette } = useTheme()
  const iw = W - PAD.left - PAD.right
  const ih = H - PAD.top - PAD.bottom
  const lengths = Array.from(
    { length: p.lMax - p.lMin + 1 },
    (_, i) => p.lMin + i
  )
  const all = lengths.flatMap((length) =>
    SERIES.map((s) => s.ln({ ...p.params, length }))
  )
  const fmax = Math.max(...all.map((v) => boxCox(v, p.lambda)))
  const x = (length: number) =>
    PAD.left + ((length - p.lMin) / (p.lMax - p.lMin)) * iw
  const y = (lnN: number) => PAD.top + ih - (boxCox(lnN, p.lambda) / fmax) * ih
  const ticks = pickDecadeTicks(Math.max(...all), y, MIN_TICK_GAP)
  const colW = iw / (p.lMax - p.lMin)
  const dim = palette.text.secondary

  return (
    <Scroll>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="長さごとのパターン数の推移"
      >
        {ticks.map(({ decade, py }) => (
          <g key={decade}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={py}
              y2={py}
              stroke={palette.divider}
            />
            <text x={PAD.left - 8} y={py + 4} textAnchor="end" fill={dim}>
              {decade === 0 ? '1' : `10${sup(decade)}`}
            </text>
          </g>
        ))}
        {lengths.map((length) => (
          <text
            key={length}
            x={x(length)}
            y={H - 12}
            textAnchor="middle"
            fill={dim}
          >
            {length}
          </text>
        ))}
        <line
          x1={x(p.params.length)}
          x2={x(p.params.length)}
          y1={PAD.top}
          y2={PAD.top + ih}
          stroke={dim}
          strokeDasharray="3 3"
        />
        {SERIES.map((s) => {
          const { color, opacity } = p.colors[s.key]
          const points = lengths
            .map((length) => {
              const ln = s.ln({ ...p.params, length })
              return `${x(length).toFixed(1)},${y(ln).toFixed(1)}`
            })
            .join(' ')
          return (
            <g key={s.key} opacity={opacity}>
              <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={2}
              />
              <circle
                cx={x(p.params.length)}
                cy={y(s.ln(p.params))}
                r={4}
                fill={color}
              />
            </g>
          )
        })}
        {lengths.map((length) => (
          <Hit
            key={length}
            x={x(length) - colW / 2}
            y={PAD.top}
            width={colW}
            height={ih}
            onClick={() => p.onSelectLength(length)}
          >
            <title>L = {length}</title>
          </Hit>
        ))}
      </svg>
    </Scroll>
  )
}

const Scroll = styled.div`
  overflow-x: auto;
  svg {
    display: block;
    width: 100%;
    min-width: 520px;
    height: auto;
    font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
`
const Hit = styled.rect`
  fill: transparent;
  cursor: pointer;
  &:hover {
    fill: rgba(127, 127, 127, 0.1);
  }
`
