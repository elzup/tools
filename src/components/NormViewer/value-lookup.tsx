import { Box, Paper, Stack, TextField, Typography } from '@mui/material'
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
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        値の逆引き
      </Typography>
      <Stack spacing={3}>
        <Box>
          <Stack direction="row" spacing={2} alignItems="flex-end">
            <TextField
              label="点数"
              type="number"
              size="small"
              value={lookupValue}
              onChange={(e) => setLookupValue(e.target.value)}
              placeholder="例: 200"
            />
            <Typography variant="body1">→</Typography>
            <Typography variant="h6" color="primary">
              {valueResult !== null
                ? `上位 ${(100 - valueResult).toFixed(1)}%`
                : '-'}
            </Typography>
          </Stack>
        </Box>
        <Box>
          <Stack direction="row" spacing={2} alignItems="flex-end">
            <TextField
              label="上位 (%)"
              type="number"
              size="small"
              value={lookupPercentile}
              onChange={(e) => setLookupPercentile(e.target.value)}
              placeholder="例: 30"
            />
            <Typography variant="body1">→</Typography>
            <Typography variant="h6" color="primary">
              {percentileResult !== null
                ? `${percentileResult.toFixed(1)}点`
                : '-'}
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  )
}
