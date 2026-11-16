import { useTheme } from '@mui/material'
import styled from 'styled-components'

import { pickWithSkip, ranksOf } from './sim'

type Props = {
  title: string
  scores: number[]
  k: number
  /** 先頭から何人目まで見せるか。scores.length で全員 */
  revealed: number
  color: string
}

const W = 360
const H = 170
const PAD = { left: 28, right: 6, top: 10, bottom: 18 }
const AXIS_MIN = 0
const AXIS_MAX = 100

export const TrialView = (p: Props) => {
  const { palette } = useTheme()
  const n = p.scores.length
  const pick = pickWithSkip(p.scores, p.k)
  const ranks = ranksOf(p.scores)
  const bestIndex = ranks.indexOf(1)
  const threshold = p.k === 0 ? null : Math.max(...p.scores.slice(0, p.k))
  // 正規分布は 0〜100 をはみ出しうるので、軸を実データに合わせて広げる
  const lo = Math.min(AXIS_MIN, ...p.scores)
  const hi = Math.max(AXIS_MAX, ...p.scores)
  const iw = W - PAD.left - PAD.right
  const ih = H - PAD.top - PAD.bottom
  const bw = iw / n
  const y = (v: number) => PAD.top + ih - ((v - lo) / (hi - lo)) * ih
  const isDone = p.revealed > pick.index

  const barColor = (i: number) => {
    if (isDone && i === pick.index) return p.color
    if (i < p.k) return palette.action.disabled
    return palette.text.secondary
  }

  return (
    <Box>
      <h4>{p.title}</h4>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${p.title} の試行`}
      >
        <rect
          x={PAD.left}
          y={PAD.top}
          width={bw * p.k}
          height={ih}
          fill={palette.action.hover}
        />
        {[lo, 50, hi].map((t) => (
          <text
            key={t}
            x={PAD.left - 4}
            y={y(t) + 4}
            fontSize={10}
            textAnchor="end"
            fill={palette.text.secondary}
          >
            {Math.round(t)}
          </text>
        ))}
        {p.scores.slice(0, p.revealed).map((v, i) => (
          <rect
            key={i}
            x={PAD.left + i * bw + bw * 0.1}
            y={y(v)}
            width={Math.max(1, bw * 0.8)}
            height={y(lo) - y(v)}
            fill={barColor(i)}
          />
        ))}
        {threshold !== null && p.revealed >= p.k && (
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(threshold)}
            y2={y(threshold)}
            stroke={palette.warning.main}
            strokeDasharray="4 3"
          />
        )}
        {isDone && (
          <text
            x={PAD.left + (bestIndex + 0.5) * bw}
            y={y(p.scores[bestIndex]) - 2}
            fontSize={12}
            textAnchor="middle"
            fill={palette.success.main}
          >
            ★
          </text>
        )}
      </svg>
      <Result data-testid="trial-result">
        {isDone
          ? `${pick.index + 1} 人目を採用: 実力 ${p.scores[pick.index].toFixed(1)} / ${n} 人中 ${ranks[pick.index]} 位${
              pick.isFallback ? ' (誰も超えず最後の人で妥協)' : ''
            }${ranks[pick.index] === 1 ? ' ★最良' : ''}`
          : `${p.revealed} / ${n} 人を面接済み`}
      </Result>
    </Box>
  )
}

const Box = styled.div`
  flex: 1 1 320px;
  min-width: 0;
  h4 {
    margin: 0 0 4px;
    font-size: 14px;
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
`

const Result = styled.div`
  font-size: 13px;
  min-height: 2.6em;
`
