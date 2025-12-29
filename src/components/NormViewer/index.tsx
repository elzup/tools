import { Box, Button, Stack, Typography } from '@mui/material'
import { useCallback, useMemo, useState } from 'react'
import {
  DistributionParams,
  estimateDistribution,
} from '../../lib/norm-estimator'
import { CalculationResults } from './calculation-results'
import { DistributionChart } from './distribution-chart'
import { InputForm } from './input-form'
import { SavedLibrary, saveManually, useAutoSave } from './saved-library'
import { ValueLookup } from './value-lookup'

const NormViewer = () => {
  const [params, setParams] = useState<DistributionParams>({
    conditions: [],
  })
  const [saveKey, setSaveKey] = useState(0)

  const result = useMemo(() => estimateDistribution(params), [params])

  // Auto save
  useAutoSave(params)

  // Manual save
  const handleSave = useCallback(() => {
    saveManually(params)
    setSaveKey((k) => k + 1)
  }, [params])

  // Set example
  const setExample = () => {
    setParams({
      conditions: [
        { id: '1', type: 'value-percentage', value: 200, percentage: 30 },
        { id: '2', type: 'value-percentage', value: 220, percentage: 10 },
      ],
    })
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          部分的な条件（例：200点→上位30%）から、平均値・標準偏差を自動推定し、分布全体を復元します。
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" onClick={setExample}>
            サンプルを入力
          </Button>
        </Stack>
      </Box>

      <SavedLibrary
        key={saveKey}
        params={params}
        setParams={setParams}
        onSave={handleSave}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1.5fr' },
          gap: 3,
        }}
      >
        <Box>
          <InputForm params={params} setParams={setParams} />
        </Box>
        <Stack spacing={3}>
          <CalculationResults result={result} />
          <ValueLookup
            mean={result.mean}
            stdDev={result.stdDev}
            isValid={result.isValid}
          />
        </Stack>
      </Box>

      {result.isValid && (
        <DistributionChart
          mean={result.mean}
          stdDev={result.stdDev}
          conditions={params.conditions}
        />
      )}
    </Stack>
  )
}

export default NormViewer
