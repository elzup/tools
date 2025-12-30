import {
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import {
  Condition,
  DistributionParams,
} from '../../lib/norm-estimator'

type Props = {
  params: DistributionParams
  setParams: (params: DistributionParams) => void
}

// 条件入力（左側）
export function ConditionsInput({ params, setParams }: Props) {
  const addCondition = () => {
    const newCond: Condition = {
      id: Date.now().toString(),
      type: 'value-percentage',
    }
    setParams({ ...params, conditions: [...params.conditions, newCond] })
  }

  const updateCondition = (id: string, field: string, value: string) => {
    const numValue = value === '' ? undefined : Number.parseFloat(value)
    const updated = params.conditions.map((c) =>
      c.id === id ? { ...c, [field]: numValue } : c
    )
    setParams({ ...params, conditions: updated })
  }

  const removeCondition = (id: string) => {
    setParams({
      ...params,
      conditions: params.conditions.filter((c) => c.id !== id),
    })
  }

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Typography variant="subtitle2">条件</Typography>
        <Button size="small" variant="outlined" onClick={addCondition}>
          + 追加
        </Button>
      </Stack>

      <Stack spacing={1}>
        {params.conditions.map((cond) => (
          <Stack key={cond.id} direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              type="number"
              value={cond.value ?? ''}
              onChange={(e) =>
                updateCondition(cond.id, 'value', e.target.value)
              }
              placeholder="点"
              sx={{ width: 80 }}
              inputProps={{ style: { textAlign: 'right' } }}
            />
            <Typography variant="body2" color="text.secondary">
              点 = 上位
            </Typography>
            <TextField
              size="small"
              type="number"
              value={cond.percentage ?? ''}
              onChange={(e) =>
                updateCondition(cond.id, 'percentage', e.target.value)
              }
              placeholder="%"
              sx={{ width: 70 }}
              inputProps={{ style: { textAlign: 'right' } }}
            />
            <Typography variant="body2" color="text.secondary">
              %
            </Typography>
            <IconButton
              size="small"
              onClick={() => removeCondition(cond.id)}
              sx={{ ml: 'auto', color: 'error.main' }}
            >
              ×
            </IconButton>
          </Stack>
        ))}
        {params.conditions.length === 0 && (
          <Typography variant="caption" color="text.secondary">
            条件を2つ以上追加、または得点データを入力
          </Typography>
        )}
      </Stack>
    </Paper>
  )
}

// 基本パラメータ入力（右上）
export function BasicParamsInput({ params, setParams }: Props) {
  const handleBasicChange = (field: string, value: string) => {
    const numValue = value === '' ? undefined : Number.parseFloat(value)
    setParams({ ...params, [field]: numValue })
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        基本パラメータ
      </Typography>
      <Stack direction="row" spacing={1}>
        <TextField
          label="μ"
          type="number"
          size="small"
          value={params.mean ?? ''}
          onChange={(e) => handleBasicChange('mean', e.target.value)}
          sx={{ flex: 1 }}
        />
        <TextField
          label="σ"
          type="number"
          size="small"
          value={params.stdDev ?? ''}
          onChange={(e) => handleBasicChange('stdDev', e.target.value)}
          sx={{ flex: 1 }}
        />
        <TextField
          label="N"
          type="number"
          size="small"
          value={params.totalCount ?? ''}
          onChange={(e) => handleBasicChange('totalCount', e.target.value)}
          sx={{ flex: 1 }}
        />
      </Stack>
    </Paper>
  )
}

// 得点データ入力（右下）
export function RawScoresInput({ params, setParams }: Props) {
  const [rawScoresText, setRawScoresText] = useState(params.rawScores?.join(', ') ?? '')

  useEffect(() => {
    const newText = params.rawScores?.join(', ') ?? ''
    if (newText !== rawScoresText.replace(/,\s*$/, '').trim()) {
      setRawScoresText(newText)
    }
  }, [params.rawScores])

  const parseAndSetRawScores = (value: string) => {
    const scores = value
      .split(/[,\s\n]+/)
      .map((s) => s.trim())
      .filter((s) => s !== '')
      .map((s) => Number.parseFloat(s))
      .filter((n) => Number.isFinite(n))
    setParams({ ...params, rawScores: scores.length > 0 ? scores : undefined })
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        得点データ
        {params.rawScores && params.rawScores.length > 0 && (
          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            (n={params.rawScores.length})
          </Typography>
        )}
      </Typography>
      <TextField
        size="small"
        fullWidth
        multiline
        minRows={1}
        maxRows={3}
        placeholder="200, 215, 180, 195..."
        value={rawScoresText}
        onChange={(e) => {
          setRawScoresText(e.target.value)
          parseAndSetRawScores(e.target.value)
        }}
        helperText="カンマ区切りで入力"
        FormHelperTextProps={{ sx: { mt: 0.5, fontSize: '0.7rem' } }}
      />
    </Paper>
  )
}

// 後方互換性のため残す
export function InputForm({ params, setParams }: Props) {
  return (
    <Stack spacing={2}>
      <BasicParamsInput params={params} setParams={setParams} />
      <ConditionsInput params={params} setParams={setParams} />
      <RawScoresInput params={params} setParams={setParams} />
    </Stack>
  )
}
