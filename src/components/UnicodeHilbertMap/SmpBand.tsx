import { Box, Typography } from '@mui/material'
import { type ColorMode, blockColorOf } from './colors'
import { countOf, smpBlocks } from './mapData'

const SAMPLE_COUNT = 6

const samplesOf = (ranges: [number, number][]) => {
  const [lo, hi] = ranges[0]
  const chars: string[] = []

  for (let cp = lo; cp <= hi && chars.length < SAMPLE_COUNT; cp++) {
    chars.push(String.fromCodePoint(cp))
  }
  return chars.join('')
}

type Props = { colorMode: ColorMode }

/** BMP の外 (U+10000 以降) にあるレア記号ブロックを帯状に補助表示する */
const SmpBand = ({ colorMode }: Props) => {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        SMP Rare Symbols (U+10000 –)
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {smpBlocks.map((block) => (
          <Box
            key={block.id}
            sx={{
              flex: `1 1 ${countOf(block) * 2}px`,
              minWidth: 120,
              p: 1,
              borderRadius: 1,
              color: '#111',
              backgroundColor: blockColorOf(
                block,
                colorMode,
                block.ranges[0][0]
              ),
            }}
          >
            <Box sx={{ fontSize: 12, fontWeight: 'bold' }}>{block.name}</Box>
            <Box sx={{ fontSize: 20, lineHeight: 1.4 }}>
              {samplesOf(block.ranges)}
            </Box>
            <Box sx={{ fontSize: 11, opacity: 0.75 }}>
              {block.id} · {block.rarity} · {countOf(block)} chars
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default SmpBand
