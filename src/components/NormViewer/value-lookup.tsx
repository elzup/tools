import { Paper, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { percentileToValue, valueToPercentile } from '../../lib/norm-estimator'

type Props = {
  mean: number
  stdDev: number
  isValid: boolean
}

export function ValueLookup({ mean, stdDev, isValid }: Props) {
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
            onChange={(e) => setLookupValue(e.target.value)}
            placeholder="点"
            sx={{ width: 80 }}
            inputProps={{ style: { textAlign: 'right' } }}
          />
          <Typography variant="body2" color="text.secondary">
            点 → 上位
          </Typography>
          <Typography variant="body2" color="primary" fontWeight="bold">
            {valueResult !== null ? `${(100 - valueResult).toFixed(1)}%` : '-'}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            type="number"
            value={lookupPercentile}
            onChange={(e) => setLookupPercentile(e.target.value)}
            placeholder="%"
            sx={{ width: 80 }}
            inputProps={{ style: { textAlign: 'right' } }}
          />
          <Typography variant="body2" color="text.secondary">
            % → 点数
          </Typography>
          <Typography variant="body2" color="primary" fontWeight="bold">
            {percentileResult !== null ? `${percentileResult.toFixed(1)}` : '-'}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  )
}
