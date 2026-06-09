import {
  Box,
  Button,
  FormControlLabel,
  Paper,
  Slider,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import { BitPairKey } from '../lib/mix8'

export type P1Map = Record<BitPairKey, number>

// 各ペアの「結果が 1 になる確率」初期値プリセット
export const DIST_PRESETS: Record<string, { label: string; p1: P1Map }> = {
  current: {
    label: '現行',
    p1: { '00': 0.125, '01': 0.5, '10': 0.5, '11': 0.875 },
  },
  uniform: {
    label: '均等',
    p1: { '00': 0.5, '01': 0.5, '10': 0.5, '11': 0.5 },
  },
  golden: {
    label: '黄金比',
    p1: { '00': 0.382, '01': 0.5, '10': 0.5, '11': 0.618 },
  },
  keep: {
    label: '完全保持',
    p1: { '00': 0, '01': 0.5, '10': 0.5, '11': 1 },
  },
}

const PAIR_LABELS: Record<BitPairKey, string> = {
  '00': '0 + 0',
  '01': '0 + 1',
  '10': '1 + 0',
  '11': '1 + 1',
}

const ORDER: BitPairKey[] = ['00', '01', '10', '11']

type Props = {
  p1: P1Map
  symmetric: boolean
  onChangeP1: (next: P1Map) => void
  onToggleSymmetric: (value: boolean) => void
}

// 対称ロック時は 00↔11 (0↔1 反転対称) と 01↔10 (A↔B 入替対称) を連動させる。
// これにより mix(a,b) と mix(b,a)、全bit反転が分布として一致する。
const applySymmetry = (next: P1Map, key: BitPairKey, value: number): P1Map => {
  if (key === '00') return { ...next, '11': 1 - value }
  if (key === '11') return { ...next, '00': 1 - value }
  if (key === '01') return { ...next, '10': value }

  return { ...next, '01': value }
}

const BitMixDistributionEditor = ({
  p1,
  symmetric,
  onChangeP1,
  onToggleSymmetric,
}: Props) => {
  const handleSlider = (key: BitPairKey) => (_: Event, value: number | number[]) => {
    const v = value as number
    const base = { ...p1, [key]: v }

    onChangeP1(symmetric ? applySymmetry(base, key, v) : base)
  }

  // 対称ロック時は派生側 (11, 10) を編集不可にして 00, 01 を主操作にする
  const isDerived = (key: BitPairKey) =>
    symmetric && (key === '11' || key === '10')

  return (
    <Paper sx={{ p: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Typography variant="subtitle1">融合分布のカスタマイズ</Typography>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={symmetric}
              onChange={(e) => onToggleSymmetric(e.target.checked)}
            />
          }
          label={<Typography variant="caption">対称ロック</Typography>}
        />
      </Stack>

      <Typography variant="caption" color="text.secondary">
        A,B の各bitの組み合わせごとに「結果が 1 になる確率」を設定します。
      </Typography>

      <Stack spacing={1.5} sx={{ mt: 1.5 }}>
        {ORDER.map((key) => (
          <Box
            key={key}
            sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
          >
            <Typography
              sx={{
                minWidth: 64,
                fontFamily: 'monospace',
                color: isDerived(key) ? 'text.disabled' : 'text.primary',
              }}
            >
              {PAIR_LABELS[key]}
            </Typography>
            <Slider
              size="small"
              min={0}
              max={1}
              step={0.005}
              value={p1[key]}
              disabled={isDerived(key)}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
              onChange={handleSlider(key)}
              sx={{ flex: 1 }}
            />
            <Typography
              variant="caption"
              sx={{ minWidth: 80, color: 'text.secondary' }}
            >
              1: {Math.round(p1[key] * 100)}% / 0: {Math.round((1 - p1[key]) * 100)}%
            </Typography>
          </Box>
        ))}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
        {Object.entries(DIST_PRESETS).map(([id, preset]) => (
          <Button
            key={id}
            size="small"
            variant="outlined"
            onClick={() => onChangeP1(preset.p1)}
          >
            {preset.label}
          </Button>
        ))}
      </Stack>
    </Paper>
  )
}

export default BitMixDistributionEditor
