import styled from 'styled-components'
import type { Matrix } from './particleLife'

const STEP = 0.25

type Props = {
  matrix: Matrix
  onChange: (m: Matrix) => void
  colorOf: (t: number, n: number) => string
}

const clamp1 = (v: number): number => Math.max(-1, Math.min(1, v))

// 端まで行ったら反対側へ回す。クリックだけで全域を巡回できるように
const cycle = (v: number, delta: number): number => {
  const next = Math.round((v + delta) / STEP) * STEP

  if (next > 1) return -1
  if (next < -1) return 1
  return clamp1(next)
}

const cellBg = (v: number): string =>
  v >= 0
    ? `rgba(46, 204, 113, ${Math.abs(v)})`
    : `rgba(231, 76, 60, ${Math.abs(v)})`

const MatrixEditor = ({ matrix, onChange, colorOf }: Props) => {
  const n = matrix.length

  const bump = (i: number, j: number, delta: number) =>
    onChange(
      matrix.map((row, r) =>
        r === i ? row.map((v, c) => (c === j ? cycle(v, delta) : v)) : row
      )
    )

  return (
    <Grid style={{ gridTemplateColumns: `20px repeat(${n}, 1fr)` }}>
      <span />
      {matrix.map((_, j) => (
        <Swatch key={`h${j}`} style={{ background: colorOf(j, n) }} />
      ))}
      {matrix.map((row, i) => [
        <Swatch key={`r${i}`} style={{ background: colorOf(i, n) }} />,
        ...row.map((v, j) => (
          <Cell
            key={`${i}-${j}`}
            type="button"
            style={{ background: cellBg(v) }}
            title={`${i} → ${j}: ${v.toFixed(2)}`}
            onClick={() => bump(i, j, STEP)}
            onContextMenu={(e) => {
              e.preventDefault()
              bump(i, j, -STEP)
            }}
          >
            {v.toFixed(1)}
          </Cell>
        )),
      ])}
    </Grid>
  )
}

const Grid = styled.div`
  display: grid;
  gap: 2px;
  align-items: center;
  background: #0b0d12;
  padding: 4px;
  border-radius: 6px;
`

const Swatch = styled.span`
  display: block;
  height: 14px;
  border-radius: 3px;
`

const Cell = styled.button`
  aspect-ratio: 1;
  min-width: 0;
  border: none;
  border-radius: 3px;
  color: #fff;
  font-size: 0.65rem;
  font-family: monospace;
  cursor: pointer;
  padding: 0;

  &:hover {
    outline: 1px solid #fff;
  }
`

export default MatrixEditor
