import { Box, Button, Stack } from '@mui/material'
import { useCallback, useMemo, useState } from 'react'
import {
  DistributionParams,
  estimateDistribution,
} from '../../lib/norm-estimator'
import { PercentileTable, ResultSummary } from './calculation-results'
import { DistributionChart } from './distribution-chart'
import { InputForm } from './input-form'
import { SavedLibrary, saveManually, useAutoSave } from './saved-library'
import { ValueLookup } from './value-lookup'

const NormViewer = () => {
  const [params, setParams] = useState<DistributionParams>({
    conditions: [],
  })
  const [saveKey, setSaveKey] = useState(0)
  const [lookupMarkers, setLookupMarkers] = useState<{ value: number | null; percentile: number | null }>({
    value: null,
    percentile: null,
  })

  const result = useMemo(() => estimateDistribution(params), [params])

  useAutoSave(params)

  const handleSave = useCallback(() => {
    saveManually(params)
    setSaveKey((k) => k + 1)
  }, [params])

  const handleLookupChange = useCallback((value: number | null, percentile: number | null) => {
    setLookupMarkers({ value, percentile })
  }, [])

  const setExample = () => {
    setParams({
      conditions: [
        { id: '1', type: 'value-percentage', value: 200, percentage: 30 },
        { id: '2', type: 'value-percentage', value: 220, percentage: 10 },
      ],
    })
  }

  return (
    <Stack spacing={2}>
      {/* 入力エリア */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="outlined" size="small" onClick={setExample}>
              Sample
            </Button>
          </Stack>
          <InputForm params={params} setParams={setParams} />
        </Stack>
        <ValueLookup
          mean={result.mean}
          stdDev={result.stdDev}
          isValid={result.isValid}
          onLookupChange={handleLookupChange}
        />
      </Box>

      {/* グラフ */}
      {result.isValid && (
        <DistributionChart
          mean={result.mean}
          stdDev={result.stdDev}
          conditions={params.conditions}
          lookupMarkers={lookupMarkers}
        />
      )}

      {/* 推定結果サマリー（1行） */}
      <ResultSummary result={result} />

      {/* パーセンタイル（折りたたみ式） */}
      <PercentileTable result={result} />

      {/* 履歴（最下部） */}
      <SavedLibrary
        key={saveKey}
        params={params}
        setParams={setParams}
        onSave={handleSave}
      />
    </Stack>
  )
}

export default NormViewer
