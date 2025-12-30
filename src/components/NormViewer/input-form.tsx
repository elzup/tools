import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import {
  Condition,
  ConditionType,
  DistributionParams,
} from '../../lib/norm-estimator'

type Props = {
  params: DistributionParams
  setParams: (params: DistributionParams) => void
}

export function InputForm({ params, setParams }: Props) {
  const [newCondType, setNewCondType] =
    useState<ConditionType>('value-percentage')

  const handleBasicChange = (field: string, value: string) => {
    const numValue = value === '' ? undefined : Number.parseFloat(value)
    setParams({ ...params, [field]: numValue })
  }

  const addCondition = () => {
    const newCond: Condition = {
      id: Date.now().toString(),
      type: newCondType,
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

  // 得点データ入力用のローカルstate（入力中のテキストを保持）
  const [rawScoresText, setRawScoresText] = useState(params.rawScores?.join(', ') ?? '')

  // params.rawScoresが外部から変更された場合に同期
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
    <Stack spacing={2}>
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

      <Paper sx={{ p: 2 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1 }}
        >
          <Typography variant="subtitle2">条件</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <ToggleButtonGroup
              value={newCondType}
              exclusive
              onChange={(_, v) => v && setNewCondType(v)}
              size="small"
            >
              <ToggleButton value="value-percentage" sx={{ px: 1, py: 0.5 }}>
                <Typography variant="caption">点→%</Typography>
              </ToggleButton>
              <ToggleButton value="percentile-value" sx={{ px: 1, py: 0.5 }}>
                <Typography variant="caption">%→点</Typography>
              </ToggleButton>
            </ToggleButtonGroup>
            <Button size="small" variant="outlined" onClick={addCondition}>
              +
            </Button>
          </Stack>
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
                {cond.type === 'value-percentage' ? '点 → 上位' : '点 ← 上位'}
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
                sx={{ ml: 'auto' }}
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
    </Stack>
  )
}
