import {
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
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

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          基本パラメータ
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          空白のままでも条件から自動推定されます
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="平均値 (μ)"
            type="number"
            size="small"
            value={params.mean ?? ''}
            onChange={(e) => handleBasicChange('mean', e.target.value)}
            placeholder="例: 100"
            fullWidth
          />
          <TextField
            label="標準偏差 (σ)"
            type="number"
            size="small"
            value={params.stdDev ?? ''}
            onChange={(e) => handleBasicChange('stdDev', e.target.value)}
            placeholder="例: 15"
            fullWidth
          />
          <TextField
            label="総数 (N)"
            type="number"
            size="small"
            value={params.totalCount ?? ''}
            onChange={(e) => handleBasicChange('totalCount', e.target.value)}
            placeholder="例: 1000"
            fullWidth
          />
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          条件を追加
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          複数の条件から未知値を推定します（最低2つ必要）
        </Typography>

        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">条件タイプ</FormLabel>
          <RadioGroup
            value={newCondType}
            onChange={(e) => setNewCondType(e.target.value as ConditionType)}
          >
            <FormControlLabel
              value="value-percentage"
              control={<Radio size="small" />}
              label="値とパーセント: 「x点以上は上位y%」"
            />
            <FormControlLabel
              value="percentile-value"
              control={<Radio size="small" />}
              label="パーセンタイルと値: 「上位x%の境界値はy点」"
            />
          </RadioGroup>
        </FormControl>

        <Button
          variant="contained"
          onClick={addCondition}
          fullWidth
          sx={{ mb: 2 }}
        >
          条件を追加
        </Button>

        <Stack spacing={2}>
          {params.conditions.map((cond) => (
            <Paper key={cond.id} variant="outlined" sx={{ p: 2 }}>
              {cond.type === 'value-percentage' && (
                <>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label="値 (点)"
                      type="number"
                      size="small"
                      value={cond.value ?? ''}
                      onChange={(e) =>
                        updateCondition(cond.id, 'value', e.target.value)
                      }
                      placeholder="例: 200"
                      fullWidth
                    />
                    <TextField
                      label="上位 (%)"
                      type="number"
                      size="small"
                      value={cond.percentage ?? ''}
                      onChange={(e) =>
                        updateCondition(cond.id, 'percentage', e.target.value)
                      }
                      placeholder="例: 30"
                      fullWidth
                    />
                  </Stack>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    {cond.value !== undefined && cond.percentage !== undefined
                      ? `${cond.value}点以上: 上位${cond.percentage}%`
                      : '値とパーセントを入力'}
                  </Typography>
                </>
              )}

              {cond.type === 'percentile-value' && (
                <>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label="上位 (%)"
                      type="number"
                      size="small"
                      value={cond.percentage ?? ''}
                      onChange={(e) =>
                        updateCondition(cond.id, 'percentage', e.target.value)
                      }
                      placeholder="例: 30"
                      fullWidth
                    />
                    <TextField
                      label="境界値 (点)"
                      type="number"
                      size="small"
                      value={cond.value ?? ''}
                      onChange={(e) =>
                        updateCondition(cond.id, 'value', e.target.value)
                      }
                      placeholder="例: 200"
                      fullWidth
                    />
                  </Stack>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    {cond.value !== undefined && cond.percentage !== undefined
                      ? `上位${cond.percentage}%の境界: ${cond.value}点`
                      : 'パーセントと値を入力'}
                  </Typography>
                </>
              )}

              <Button
                variant="text"
                color="error"
                size="small"
                onClick={() => removeCondition(cond.id)}
                sx={{ mt: 1 }}
              >
                削除
              </Button>
            </Paper>
          ))}
        </Stack>
      </Paper>
    </Stack>
  )
}
