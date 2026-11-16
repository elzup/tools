import { useTheme } from '@mui/material'
import styled from 'styled-components'

export type Series = {
  label: string
  color: string
  values: number[]
  dashed?: boolean
}

export type Marker = {
  label: string
  x: number
  color: string
}

type Props = {
  ariaLabel: string
  series: Series[]
  yMin: number
  yMax: number
  yTicks: number[]
  formatY: (v: number) => string
  markers: Marker[]
  onSelectX?: (index: number) => void
}

const W = 760
const H = 300
const PAD = { left: 52, right: 16, top: 22, bottom: 34 }
const X_TICKS = [0, 0.2, 0.4, 0.6, 0.8, 1]

/** 横軸は「見送った割合 k/n」。系列の要素数 n で 0..1 に正規化する */
export const LineChart = (p: Props) => {
  const { palette } = useTheme()
  const iw = W - PAD.left - PAD.right
  const ih = H - PAD.top - PAD.bottom
  const n = Math.max(...p.series.map((s) => s.values.length))
  const x = (ratio: number) => PAD.left + ratio * iw
  const y = (v: number) =>
    PAD.top + ih - ((v - p.yMin) / (p.yMax - p.yMin)) * ih
  const dim = palette.text.secondary

  const handleClick = (e: React.MouseEvent<SVGRectElement>) => {
    if (!p.onSelectX) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    p.onSelectX(Math.min(n - 1, Math.max(0, Math.round(ratio * n))))
  }

  return (
    <Wrap>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={p.ariaLabel}>
        {p.yTicks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke={palette.divider}
            />
            <text
              x={PAD.left - 6}
              y={y(t) + 4}
              textAnchor="end"
              fontSize={11}
              fill={dim}
            >
              {p.formatY(t)}
            </text>
          </g>
        ))}
        {X_TICKS.map((t) => (
          <text
            key={t}
            x={x(t)}
            y={H - 12}
            textAnchor="middle"
            fontSize={11}
            fill={dim}
          >
            {Math.round(t * 100)}%
          </text>
        ))}
        {p.markers.map((m) => (
          <g key={m.label}>
            <line
              x1={x(m.x)}
              x2={x(m.x)}
              y1={PAD.top}
              y2={PAD.top + ih}
              stroke={m.color}
              strokeDasharray="4 3"
            />
            <text x={x(m.x) + 4} y={PAD.top - 6} fontSize={11} fill={m.color}>
              {m.label}
            </text>
          </g>
        ))}
        {p.series.map((s) => (
          <polyline
            key={s.label}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeDasharray={s.dashed ? '6 4' : undefined}
            points={s.values
              .map((v, i) => `${x(i / s.values.length)},${y(v)}`)
              .join(' ')}
          />
        ))}
        {/* 透明な面でクリックを受けて k を選べるようにする */}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={iw}
          height={ih}
          fill="transparent"
          style={{ cursor: p.onSelectX ? 'pointer' : 'default' }}
          onClick={handleClick}
        />
      </svg>
      <Legend>
        {p.series.map((s) => (
          <span key={s.label}>
            <i
              style={{
                borderTop: `2px ${s.dashed ? 'dashed' : 'solid'} ${s.color}`,
              }}
            />
            {s.label}
          </span>
        ))}
      </Legend>
    </Wrap>
  )
}

const Wrap = styled.div`
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
`

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  i {
    display: inline-block;
    width: 18px;
  }
`
