import { range } from '@elzup/kit/lib/range'
import {
  FormControlLabel,
  Slider,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { memo, useMemo, useState } from 'react'
import { useInterval } from 'react-use'
import styled from 'styled-components'
import { Box } from '../common/mui'

type ChannelKey = 'r' | 'g' | 'b'

type Levels = Record<ChannelKey, number>

type Rgb = Record<ChannelKey, number>

type ViewMode = 'grid' | 'map'

const PAIR_GAP = 3

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

// 値が 0 より大きい (= 点滅に使われる) チャンネル数。0〜1 のものは混色になっていない
const activeCount = ({ r, g, b }: Rgb): number =>
  [r, g, b].filter((v) => v > 0).length

// 点滅で「今どの原色を発光させるか」を選ぶ。
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

// RGB 立方体をキャビネット投影 (R→右, G→上, B→斜め奥) して 2D 座標 (0-100%) に落とす。
// 黒〜白の各頂点が潰れずに描けるので「どの組み合わせを埋めたか」が見える。
const DEPTH = 0.5
const projectCube = ({ r, g, b }: Rgb): { x: number; y: number } => {
  const k = Math.SQRT1_2 * DEPTH
  const max = 1 + k
  const sx = r / 255 + (b / 255) * k
  const sy = g / 255 + (b / 255) * k

  return { x: (sx / max) * 100, y: (1 - sy / max) * 100 }
}

// 値 v が、分割数 L のうち何段階目 (0-origin) かを返す
const levelIndex = (v: number, levels: number): number =>
  levels <= 1 ? 0 : Math.round((v / 255) * (levels - 1))

type Config = {
  levels: Levels
  speedMs: number
  cellPx: number
  view: ViewMode
  hideMono: boolean
}

const initConfig: Config = {
  levels: { r: 3, g: 3, b: 3 },
  speedMs: 16,
  cellPx: 56,
  view: 'grid',
  hideMono: true,
}

type ColorCellProps = {
  r: number
  g: number
  b: number
  levels: Levels
  flashColor: string
  size: number
  label: string
}

// 左に点滅セル (時間混色)、右に目標色セル (静的な加法混色) を並べ、
// 下に必ず R/G/B 3 原色をその level 番号付きで出す。
// r/g/b を数値で渡すことで、点滅色が変わらないセルは props 不変となり再描画されない。
const ColorCell = memo(
  ({ r, g, b, levels, flashColor, size, label }: ColorCellProps) => {
    const mix = `rgb(${r}, ${g}, ${b})`
    const parts = [
      { key: 'r', css: `rgb(${r}, 0, 0)`, lv: levelIndex(r, levels.r) },
      { key: 'g', css: `rgb(0, ${g}, 0)`, lv: levelIndex(g, levels.g) },
      { key: 'b', css: `rgb(0, 0, ${b})`, lv: levelIndex(b, levels.b) },
    ]

    return (
      <CellGroup title={label}>
        <Pair style={{ gap: PAIR_GAP }}>
          <Cell
            style={{ background: flashColor, width: size, height: size }}
            title={`点滅 (時間混色)`}
          />
          <Cell
            style={{ background: mix, width: size, height: size }}
            title={`目標色 ${mix}`}
          />
        </Pair>
        <Parts style={{ width: size * 2 + PAIR_GAP, height: Math.round(size / 3) }}>
          {parts.map((c) => (
            <Part
              key={c.key}
              style={{ background: c.css }}
              title={`${c.css} (level ${c.lv})`}
            >
              {c.lv}
            </Part>
          ))}
        </Parts>
      </CellGroup>
    )
  }
)
ColorCell.displayName = 'ColorCell'

type MapCellProps = {
  flashColor: string
  size: number
  x: number
  y: number
  label: string
}

// RGB 立方体座標 (キャビネット投影) の該当位置に点滅スウォッチを配置する
const MapColorCell = memo(({ flashColor, size, x, y, label }: MapCellProps) => (
  <MapCell
    title={label}
    style={{
      background: flashColor,
      width: size,
      height: size,
      left: `${x}%`,
      top: `${y}%`,
    }}
  />
))
MapColorCell.displayName = 'MapColorCell'

const RgbCombo = () => {
  const [config, setConfig] = useState<Config>(initConfig)
  const [phase, setPhase] = useState(0)
  const { levels, speedMs, cellPx, view, hideMono } = config

  useInterval(() => setPhase((p) => p + 1), speedMs)

  const setLevel = (key: ChannelKey, value: number) =>
    setConfig((c) => ({ ...c, levels: { ...c.levels, [key]: value } }))
  const setSpeedMs = (speedMs: number) => setConfig((c) => ({ ...c, speedMs }))
  const setCellPx = (cellPx: number) => setConfig((c) => ({ ...c, cellPx }))
  const setView = (view: ViewMode) => setConfig((c) => ({ ...c, view }))
  const toggleHideMono = () => setConfig((c) => ({ ...c, hideMono: !c.hideMono }))

  const combos = useMemo(() => buildCombos(levels), [levels])
  // 混色になっていない単色 (アクティブ 1 ch 以下: 単一原色・黒) を隠す
  const shown = useMemo(
    () => (hideMono ? combos.filter((c) => activeCount(c) >= 2) : combos),
    [combos, hideMono]
  )

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

        <Box sx={{ width: 180 }}>
          <Typography>点滅間隔: {speedMs}ms</Typography>
          <Slider
            value={speedMs}
            valueLabelDisplay="auto"
            onChange={(_, v) => setSpeedMs(Number(v))}
            step={8}
            min={16}
            max={500}
          />
        </Box>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          onChange={(_, v: ViewMode | null) => v && setView(v)}
        >
          <ToggleButton value="grid">グリッド</ToggleButton>
          <ToggleButton value="map">RGB 立方体</ToggleButton>
        </ToggleButtonGroup>

        <FormControlLabel
          control={<Switch checked={hideMono} onClick={toggleHideMono} />}
          label="単色 (混色なし) を隠す"
          labelPlacement="end"
        />
      </Controls>

      <Typography sx={{ my: 1 }}>
        全組み合わせ {levels.r} × {levels.g} × {levels.b} = <strong>{combos.length}</strong>{' '}
        色 / 表示 <strong>{shown.length}</strong> 色 ・ 左=点滅 / 右=目標色
      </Typography>

      {view === 'grid' ? (
        <Grid
          style={{ gridTemplateColumns: `repeat(auto-fill, ${cellPx * 2 + PAIR_GAP}px)` }}
        >
          {shown.map((combo) => (
            <ColorCell
              key={`${combo.r}-${combo.g}-${combo.b}`}
              r={combo.r}
              g={combo.g}
              b={combo.b}
              levels={levels}
              flashColor={blinkColor(combo, phase)}
              size={cellPx}
              label={toCss(combo)}
            />
          ))}
        </Grid>
      ) : (
        <MapPlane>
          <AxisLabel style={{ right: 6, bottom: 6 }}>R →</AxisLabel>
          <AxisLabel style={{ left: 6, top: 6 }}>↑ G</AxisLabel>
          <AxisLabel style={{ left: '34%', top: '64%' }}>↗ B</AxisLabel>
          {shown.map((combo) => {
            const { x, y } = projectCube(combo)

            return (
              <MapColorCell
                key={`${combo.r}-${combo.g}-${combo.b}`}
                flashColor={blinkColor(combo, phase)}
                size={Math.min(cellPx, 28)}
                x={x}
                y={y}
                label={toCss(combo)}
              />
            )
          })}
        </MapPlane>
      )}
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
  gap: 16px;
  justify-content: start;
`

const CellGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`

const Pair = styled.div`
  display: flex;
`

const Cell = styled.div`
  border-radius: 2px;
`

const Parts = styled.div`
  display: flex;
  gap: 1px;

  & > div {
    flex: 1;
    border-radius: 1px;
  }
`

const Part = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  line-height: 1;
  color: #fff;
  text-shadow: 0 0 2px #000, 0 0 3px #000;
`

const MapPlane = styled.div`
  position: relative;
  width: 100%;
  height: 520px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #222;
  overflow: hidden;
`

const MapCell = styled.div`
  position: absolute;
  transform: translate(-50%, -50%);
  border-radius: 2px;
`

const AxisLabel = styled.div`
  position: absolute;
  font-size: 0.8rem;
  color: #aaa;
  pointer-events: none;
`

export default RgbCombo
