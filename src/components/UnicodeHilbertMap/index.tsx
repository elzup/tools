import { Box, Button, FormControlLabel, Radio, RadioGroup } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import Legend from './Legend'
import SmpBand from './SmpBand'
import {
  COLOR_MODES,
  type ColorMode,
  SPECIAL_LABELS,
  specialOf,
} from './colors'
import {
  MAX_WALL_LEVEL,
  N,
  SIZE,
  blocks,
  buildBlockIndex,
  toHex,
} from './mapData'
import { LAYOUTS, type MapLayout, buildPositions } from './positions'
import { renderMap } from './render'

type Hover = { cp: number; char: string; label: string }

const hoverOf = (cp: number, blockIndex: Int16Array): Hover => {
  const special = specialOf(cp)
  const index = blockIndex[cp]
  const label = special
    ? SPECIAL_LABELS[special]
    : index < 0
      ? '未割当'
      : blocks[index].name

  return { cp, char: special ? '' : String.fromCodePoint(cp), label }
}

const UnicodeHilbertMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [layout, setLayout] = useState<MapLayout>('hilbert')
  const [colorMode, setColorMode] = useState<ColorMode>('family')
  const [wallLevel, setWallLevel] = useState(2)
  const [hover, setHover] = useState<Hover | null>(null)

  const blockIndex = useMemo(buildBlockIndex, [])
  const positions = useMemo(() => buildPositions(layout), [layout])

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')

    if (!ctx) return
    renderMap(ctx, positions, blockIndex, colorMode, wallLevel)
  }, [positions, blockIndex, colorMode, wallLevel])

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * N)
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * N)

    if (x < 0 || x >= N || y < 0 || y >= N) return
    setHover(hoverOf(positions.cpAt[y * N + x], blockIndex))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 1 }}>
        <RadioGroup
          row
          value={layout}
          onChange={(e) => setLayout(e.target.value as MapLayout)}
        >
          {LAYOUTS.map((item) => (
            <FormControlLabel
              key={item.id}
              value={item.id}
              control={<Radio size="small" />}
              label={item.label}
            />
          ))}
        </RadioGroup>
        <RadioGroup
          row
          value={colorMode}
          onChange={(e) => setColorMode(e.target.value as ColorMode)}
        >
          {COLOR_MODES.map((item) => (
            <FormControlLabel
              key={item.id}
              value={item.id}
              control={<Radio size="small" />}
              label={item.label}
            />
          ))}
        </RadioGroup>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setWallLevel((v) => (v + 1) % (MAX_WALL_LEVEL + 1))}
        >
          ヒルベルト曲線の壁 Lv.{wallLevel}
        </Button>
      </Box>
      <Box sx={{ fontFamily: 'monospace', minHeight: 28, mb: 1 }}>
        {hover ? (
          <>
            {toHex(hover.cp)}{' '}
            <Box component="span" sx={{ fontSize: 20 }}>
              {hover.char}
            </Box>{' '}
            {hover.label}
          </>
        ) : (
          'hover で codepoint / 文字 / ブロック名を表示'
        )}
      </Box>
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        style={{
          width: '100%',
          maxWidth: SIZE,
          aspectRatio: '1 / 1',
          imageRendering: 'pixelated',
          background: '#222',
          borderRadius: 4,
          cursor: 'crosshair',
        }}
      />
      <Legend colorMode={colorMode} />
      <SmpBand colorMode={colorMode} />
    </Box>
  )
}

export default UnicodeHilbertMap
