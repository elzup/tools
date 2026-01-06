import { Paper, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { percentileToValue, valueToPercentile } from '../../lib/norm-estimator'

// 数値を妥当な桁数で表示
function formatSmart(num: number): string {
  if (!Number.isFinite(num)) return ''

  const absNum = Math.abs(num)

  if (absNum === 0) return '0'

  if (absNum >= 10) {
    return num.toFixed(1)
  } else if (absNum >= 1) {
    return num.toFixed(2).replace(/\.?0+$/, '')
  } else {
    const log = Math.floor(Math.log10(absNum))
    const decimals = Math.max(1, -log + 1)
    return num.toFixed(decimals)
  }
}

type Props = {
  mean: number
  stdDev: number
  isValid: boolean
  lookupMarkers?: { value: number | null; percentile: number | null }
  onLookupChange?: (lookupValue: number | null, lookupPercentile: number | null) => void
}

export function ValueLookup({ mean, stdDev, isValid, lookupMarkers, onLookupChange }: Props) {
  const [valueInput, setValueInput] = useState<string>('')
  const [percentInput, setPercentInput] = useState<string>('50')
  const [lastEdited, setLastEdited] = useState<'value' | 'percent' | null>('percent')
  const [initialized, setInitialized] = useState(false)
  const [_lastExternalUpdate, setLastExternalUpdate] = useState<number>(0)

  // 初期化: 有効になったら50%をデフォルトで計算
  useEffect(() => {
    if (!isValid || initialized) return

    const pct = 50
    const val = percentileToValue(100 - pct, mean, stdDev)
    setValueInput(formatSmart(val))
    onLookupChange?.(val, pct)
    setInitialized(true)
  }, [isValid, initialized, mean, stdDev, onLookupChange])

  // 外部からの変更（スライダーなど）を同期
  useEffect(() => {
    if (!isValid || !initialized) return
    if (lookupMarkers?.value == null || lookupMarkers?.percentile == null) return

    // 外部からの変更を検出（現在の入力値と異なる場合）
    const currentVal = Number(valueInput)
    const externalVal = lookupMarkers.value
    const diff = Math.abs(currentVal - externalVal)

    // 差が大きい場合のみ更新（自分の変更を上書きしないように）
    if (diff > 0.01) {
      setValueInput(formatSmart(externalVal))
      setPercentInput(formatSmart(lookupMarkers.percentile))
      setLastExternalUpdate(Date.now())
    }
  }, [lookupMarkers?.value, lookupMarkers?.percentile, isValid, initialized])

  // mean/stdDevが変わったら再計算
  useEffect(() => {
    if (!isValid || !initialized) return

    if (lastEdited === 'value' && valueInput !== '') {
      const val = Number(valueInput)
      if (Number.isFinite(val)) {
        const pct = valueToPercentile(val, mean, stdDev)
        const topPct = 100 - pct
        setPercentInput(formatSmart(topPct))
        onLookupChange?.(val, topPct)
      }
    } else if (lastEdited === 'percent' && percentInput !== '') {
      const pct = Number(percentInput)
      if (Number.isFinite(pct)) {
        const val = percentileToValue(100 - pct, mean, stdDev)
        setValueInput(formatSmart(val))
        onLookupChange?.(val, pct)
      }
    }
  }, [mean, stdDev, isValid, initialized])

  if (!isValid) return null

  const handleValueChange = (v: string) => {
    setValueInput(v)
    setLastEdited('value')

    if (v === '') {
      setPercentInput('')
      onLookupChange?.(null, null)
      return
    }

    const val = Number(v)
    if (Number.isFinite(val)) {
      const pct = valueToPercentile(val, mean, stdDev)
      const topPct = 100 - pct
      setPercentInput(formatSmart(topPct))
      onLookupChange?.(val, topPct)
    }
  }

  const handlePercentChange = (v: string) => {
    setPercentInput(v)
    setLastEdited('percent')

    if (v === '') {
      setValueInput('')
      onLookupChange?.(null, null)
      return
    }

    const pct = Number(v)
    if (Number.isFinite(pct)) {
      const val = percentileToValue(100 - pct, mean, stdDev)
      setValueInput(formatSmart(val))
      onLookupChange?.(val, pct)
    }
  }

  return (
    <Paper sx={{ p: 1.5 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="subtitle2" sx={{ flexShrink: 0 }}>逆引き:</Typography>
        <TextField
          size="small"
          type="number"
          value={valueInput}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder="点"
          sx={{ width: 90 }}
          inputProps={{ style: { textAlign: 'right' } }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
          点 = 上位
        </Typography>
        <TextField
          size="small"
          type="number"
          value={percentInput}
          onChange={(e) => handlePercentChange(e.target.value)}
          placeholder="%"
          sx={{ width: 80 }}
          inputProps={{ style: { textAlign: 'right' } }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
          %
        </Typography>
      </Stack>
    </Paper>
  )
}
