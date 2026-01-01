import { Box, Button, Stack } from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DistributionParams,
  estimateDistribution,
} from '../../lib/norm-estimator'
import { PercentileTable, ResultSummary } from './calculation-results'
import { DistributionChart } from './distribution-chart'
import { BasicParamsInput, ConditionsInput, RawScoresInput } from './input-form'
import { loadSavedEntries, SavedLibrary, saveManually, useAutoSave } from './saved-library'
import { ValueLookup } from './value-lookup'

const NormViewer = () => {
  const [params, setParams] = useState<DistributionParams>({
    conditions: [],
  })
  const [initialized, setInitialized] = useState(false)

  // リロード時に最新の履歴を復元
  useEffect(() => {
    if (initialized) return
    const entries = loadSavedEntries()
    if (entries.length > 0) {
      // 最新のエントリを復元
      const latest = entries[0]
      setParams(latest.params)
    }
    setInitialized(true)
  }, [initialized])
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
      {/* 入力エリア: 条件(左) | 基本パラメータ+得点データ(右) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
        }}
      >
        {/* 左: 条件 + サンプルボタン */}
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="outlined" size="small" onClick={setExample}>
              Sample
            </Button>
          </Stack>
          <ConditionsInput params={params} setParams={setParams} />
        </Stack>

        {/* 右: 基本パラメータ + 得点データ */}
        <Stack spacing={2}>
          <BasicParamsInput params={params} setParams={setParams} />
          <RawScoresInput params={params} setParams={setParams} />
        </Stack>
      </Box>

      {/* 逆引き（フル幅） */}
      <ValueLookup
        mean={result.mean}
        stdDev={result.stdDev}
        isValid={result.isValid}
        lookupMarkers={lookupMarkers}
        onLookupChange={handleLookupChange}
      />

      {/* 推定結果サマリー（1行） */}
      <ResultSummary result={result} />

      {/* グラフ + パーセンタイル（横並び） */}
      {result.isValid && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr auto' },
            gap: 2,
            alignItems: 'start',
          }}
        >
          <DistributionChart
            mean={result.mean}
            stdDev={result.stdDev}
            conditions={params.conditions}
            lookupMarkers={lookupMarkers}
            rawScores={params.rawScores}
            onLookupChange={handleLookupChange}
          />
          <PercentileTable result={result} />
        </Box>
      )}

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
