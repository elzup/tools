import { Paper, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { percentileToValue, valueToPercentile } from '../../lib/norm-estimator'

// 数値を妥当な桁数で表示
// - 0以外の数字を上から2つは表示
// - 小数点以下1つは必ず表示
function formatSmart(num: number): string {
  if (!Number.isFinite(num)) return '-'

  const absNum = Math.abs(num)

  if (absNum === 0) return '0.0'

  if (absNum >= 10) {
    // 10以上: 小数点以下1桁
    return num.toFixed(1)
  } else if (absNum >= 1) {
    // 1-10: 小数点以下2桁（有効数字2-3桁）
    return num.toFixed(2).replace(/0$/, '')
  } else {
    // 1未満: 有効数字2桁を確保
    // 先頭の0を除いて最初の非0桁を見つける
    const log = Math.floor(Math.log10(absNum))
    const decimals = Math.max(1, -log + 1) // 有効数字2桁分
    return num.toFixed(decimals)
  }
}

type Props = {
  mean: number
  stdDev: number
  isValid: boolean
  onLookupChange?: (lookupValue: number | null, lookupPercentile: number | null) => void
}

export function ValueLookup({ mean, stdDev, isValid, onLookupChange }: Props) {
  const [lookupValue, setLookupValue] = useState<string>('')
  const [lookupPercentile, setLookupPercentile] = useState<string>('')

  if (!isValid) return null

  const valueResult =
    lookupValue !== ''
      ? valueToPercentile(Number(lookupValue), mean, stdDev)
      : null
  const percentileResult =
    lookupPercentile !== ''
      ? percentileToValue(Number(lookupPercentile), mean, stdDev)
      : null

  // 親に通知
  const handleValueChange = (v: string) => {
    setLookupValue(v)
    const numVal = v !== '' ? Number(v) : null
    onLookupChange?.(numVal, lookupPercentile !== '' ? Number(lookupPercentile) : null)
  }

  const handlePercentileChange = (v: string) => {
    setLookupPercentile(v)
    const numPct = v !== '' ? Number(v) : null
    onLookupChange?.(lookupValue !== '' ? Number(lookupValue) : null, numPct)
  }

  // 上位%の表示（100 - パーセンタイル）
  const topPercentDisplay = valueResult !== null ? formatSmart(100 - valueResult) : '-'

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        逆引き
      </Typography>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            type="number"
            value={lookupValue}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="点"
            sx={{ width: 80 }}
            inputProps={{ style: { textAlign: 'right' } }}
          />
          <Typography variant="body2" color="text.secondary">
            点 → 上位
          </Typography>
          <Typography variant="body2" color="primary" fontWeight="bold">
            {topPercentDisplay !== '-' ? `${topPercentDisplay}%` : '-'}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            type="number"
            value={lookupPercentile}
            onChange={(e) => handlePercentileChange(e.target.value)}
            placeholder="%"
            sx={{ width: 80 }}
            inputProps={{ style: { textAlign: 'right' } }}
          />
          <Typography variant="body2" color="text.secondary">
            % → 点数
          </Typography>
          <Typography variant="body2" color="primary" fontWeight="bold">
            {percentileResult !== null ? formatSmart(percentileResult) : '-'}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  )
}
