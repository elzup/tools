import { range } from '@elzup/kit/lib/range'
import { FormControlLabel, Slider, Switch, Typography } from '@mui/material'
import { useState } from 'react'
import { useInterval } from 'react-use'
import styled from 'styled-components'
import { Box } from '../common/mui'

type ChannelKey = 'r' | 'g' | 'b'

type Levels = Record<ChannelKey, number>

type Rgb = Record<ChannelKey, number>

const CHANNELS: { key: ChannelKey; label: string }[] = [
  { key: 'r', label: 'R' },
  { key: 'g', label: 'G' },
  { key: 'b', label: 'B' },
]

// レベル数 L のとき 0〜255 を L 段階に等分する
const channelSteps = (levels: number): number[] =>
  range(levels).map((i) => Math.round((i / (levels - 1)) * 255))

// R/G/B 各チャンネルの段階値の直積で全組み合わせを列挙する
const buildCombos = ({ r, g, b }: Levels): Rgb[] => {
  const rs = channelSteps(r)
  const gs = channelSteps(g)
  const bs = channelSteps(b)

  return rs.flatMap((rv) =>
    gs.flatMap((gv) => bs.map((bv) => ({ r: rv, g: gv, b: bv })))
  )
}

const toCss = ({ r, g, b }: Rgb) => `rgb(${r}, ${g}, ${b})`

// 点滅モードで「今どの原色を発光させるか」を選ぶ。
// 値が 0 より大きいチャンネルだけを R→G→B 順に巡回させる (例: マゼンタ = R,B,R,B...)
const blinkColor = (combo: Rgb, phase: number): string => {
  const actives = CHANNELS.filter((c) => combo[c.key] > 0)

  if (actives.length === 0) return 'rgb(0, 0, 0)'

  const active = actives[phase % actives.length]

  return toCss({
    r: 0,
    g: 0,
    b: 0,
    [active.key]: combo[active.key],
  })
}

type Config = {
  levels: Levels
  blink: boolean
  speedMs: number
  cellPx: number
}

const initConfig: Config = {
  levels: { r: 3, g: 3, b: 3 },
  blink: false,
  speedMs: 120,
  cellPx: 56,
}

const RgbCombo = () => {
  const [config, setConfig] = useState<Config>(initConfig)
  const [phase, setPhase] = useState(0)
  const { levels, blink, speedMs, cellPx } = config

  useInterval(() => setPhase((p) => p + 1), blink ? speedMs : null)

  const setLevel = (key: ChannelKey, value: number) =>
    setConfig((c) => ({ ...c, levels: { ...c.levels, [key]: value } }))
  const toggleBlink = () => setConfig((c) => ({ ...c, blink: !c.blink }))
  const setSpeedMs = (speedMs: number) => setConfig((c) => ({ ...c, speedMs }))
  const setCellPx = (cellPx: number) => setConfig((c) => ({ ...c, cellPx }))

  const combos = buildCombos(levels)
  const total = combos.length

  return (
    <Style>
      <Controls>
        {CHANNELS.map(({ key, label }) => (
          <Box key={key} sx={{ width: 180 }}>
            <Typography>
              {label} 分割数: {levels[key]}
            </Typography>
            <Slider
              value={levels[key]}
              valueLabelDisplay="auto"
              onChange={(_, v) => setLevel(key, Number(v))}
              marks
              min={2}
              max={8}
            />
          </Box>
        ))}

        <Box sx={{ width: 180 }}>
          <Typography>セルサイズ: {cellPx}px</Typography>
          <Slider
            value={cellPx}
            valueLabelDisplay="auto"
            onChange={(_, v) => setCellPx(Number(v))}
            step={8}
            min={16}
            max={120}
          />
        </Box>

        <FormControlLabel
          control={<Switch checked={blink} onClick={toggleBlink} />}
          label="原色点滅 (時間混色)"
          labelPlacement="end"
        />

        {blink && (
          <Box sx={{ width: 180 }}>
            <Typography>点滅間隔: {speedMs}ms</Typography>
            <Slider
              value={speedMs}
              valueLabelDisplay="auto"
              onChange={(_, v) => setSpeedMs(Number(v))}
              step={20}
              min={40}
              max={500}
            />
          </Box>
        )}
      </Controls>

      <Typography sx={{ my: 1 }}>
        全組み合わせ: {levels.r} × {levels.g} × {levels.b} ={' '}
        <strong>{total}</strong> 色
      </Typography>

      <Grid style={{ gridTemplateColumns: `repeat(auto-fill, ${cellPx}px)` }}>
        {combos.map((combo) => {
          const css = blink ? blinkColor(combo, phase) : toCss(combo)

          return (
            <Cell
              key={`${combo.r}-${combo.g}-${combo.b}`}
              style={{
                background: css,
                width: cellPx,
                height: cellPx,
              }}
              title={toCss(combo)}
            />
          )
        })}
      </Grid>
    </Style>
  )
}

const Style = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1.5rem;
`

const Grid = styled.div`
  display: grid;
  gap: 2px;
`

const Cell = styled.div`
  border-radius: 2px;
`

export default RgbCombo
