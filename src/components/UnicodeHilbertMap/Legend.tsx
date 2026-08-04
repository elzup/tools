import { Box } from '@mui/material'
import {
  type ColorMode,
  RARITY_COLORS,
  SPECIAL_LABELS,
  blockColorOf,
  familyColorOf,
  specialColorOf,
} from './colors'
import { FAMILIES, familyOf } from './family'
import { bmpBlocks } from './mapData'

type Item = { key: string; label: string; color: string }

const specialItems: Item[] = (
  Object.keys(SPECIAL_LABELS) as (keyof typeof SPECIAL_LABELS)[]
).map((key) => ({
  key,
  label: SPECIAL_LABELS[key],
  color: specialColorOf(key),
}))

const familyItems = (): Item[] => {
  const used = new Set(bmpBlocks.map((b) => familyOf(b.id).id))

  return FAMILIES.filter((f) => used.has(f.id)).map((f) => ({
    key: f.id,
    label: f.label,
    color: familyColorOf(f),
  }))
}

const rarityItems: Item[] = (
  Object.keys(RARITY_COLORS) as (keyof typeof RARITY_COLORS)[]
).map((rarity) => ({
  key: rarity,
  label: rarity,
  color: RARITY_COLORS[rarity],
}))

const blockItems = (mode: ColorMode): Item[] =>
  bmpBlocks.map((block) => ({
    key: block.id,
    label: block.name,
    color: blockColorOf(block, mode),
  }))

const itemsOf = (mode: ColorMode): Item[] => {
  if (mode === 'family') return familyItems()
  if (mode === 'rarity') return rarityItems
  return blockItems(mode)
}

type Props = { colorMode: ColorMode }

const Legend = ({ colorMode }: Props) => {
  const items = [...itemsOf(colorMode), ...specialItems]

  return (
    <Box
      sx={{
        mt: 2,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 0.5,
        maxHeight: 240,
        overflowY: 'auto',
        fontSize: 12,
      }}
    >
      {items.map((item) => (
        <Box
          key={item.key}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '2px',
              flexShrink: 0,
              backgroundColor: item.color,
            }}
          />
          <span>{item.label}</span>
        </Box>
      ))}
    </Box>
  )
}

export default Legend
