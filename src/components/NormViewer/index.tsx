import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import {
  Condition,
  ConditionType,
  DistributionParams,
  EstimationResult,
  estimateDistribution,
  normalPDF,
  percentileToValue,
  valueToPercentile,
} from '../../lib/norm-estimator'

// 分布チャートコンポーネント
function DistributionChart({
  mean,
  stdDev,
  conditions,
}: {
  mean: number
  stdDev: number
  conditions: Condition[]
}) {
  const chartData = useMemo(() => {
    if (!Number.isFinite(mean) || !Number.isFinite(stdDev) || stdDev <= 0) {
      return []
    }
    const points = []
    const step = (6 * stdDev) / 300

    for (let i = mean - 3 * stdDev; i <= mean + 3 * stdDev; i += step) {
      points.push({
        x: i,
        y: normalPDF(i, mean, stdDev),
      })
    }
    return points
  }, [mean, stdDev])

  if (chartData.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          正規分布グラフ
        </Typography>
        <Box
          sx={{
            width: '100%',
            height: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.100',
            borderRadius: 1,
          }}
        >
          <Typography color="text.secondary">
            条件を入力してください
          </Typography>
        </Box>
      </Paper>
    )
  }

  const maxY = Math.max(...chartData.map((p) => p.y))
  const minX = mean - 3 * stdDev
  const maxX = mean + 3 * stdDev
  const range = maxX - minX

  const width = 800
  const height = 300
  const padding = 50

  // 条件の点をマーク
  const conditionMarks = conditions
    .filter(
      (c) => c.value !== undefined && c.percentage !== undefined
    )
    .map((c) => ({
      x: c.value!,
      label: `${c.value}点 (${c.type === 'value-percentage' ? `上位${c.percentage}%` : `${100 - c.percentage!}パーセンタイル`})`,
    }))

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        正規分布グラフ
      </Typography>

      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ maxWidth: '100%' }}
      >
        {/* Grid */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`grid-${i}`}
            x1={padding + (i * (width - 2 * padding)) / 4}
            y1={padding}
            x2={padding + (i * (width - 2 * padding)) / 4}
            y2={height - padding}
            stroke="#e0e0e0"
            strokeDasharray="4"
            strokeWidth="0.5"
          />
        ))}

        {/* Axes */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#333"
          strokeWidth="2"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#333"
          strokeWidth="2"
        />

        {/* 1σ range */}
        <rect
          x={padding + ((mean - stdDev - minX) / range) * (width - 2 * padding)}
          y={padding}
          width={((2 * stdDev) / range) * (width - 2 * padding)}
          height={height - 2 * padding}
          fill="#2196f3"
          opacity="0.1"
        />

        {/* Distribution curve */}
        <polyline
          points={chartData
            .map((point) => {
              const x =
                padding + ((point.x - minX) / range) * (width - 2 * padding)
              const y =
                height - padding - (point.y / maxY) * (height - 2 * padding)
              return `${x},${y}`
            })
            .join(' ')}
          fill="none"
          stroke="#1976d2"
          strokeWidth="2"
        />

        {/* Mean line */}
        <line
          x1={padding + ((mean - minX) / range) * (width - 2 * padding)}
          y1={padding}
          x2={padding + ((mean - minX) / range) * (width - 2 * padding)}
          y2={height - padding}
          stroke="#f50057"
          strokeWidth="2"
          strokeDasharray="4"
        />

        {/* Condition marks */}
        {conditionMarks.map((mark, i) => {
          const xPos =
            padding + ((mark.x - minX) / range) * (width - 2 * padding)
          if (xPos < padding || xPos > width - padding) return null
          return (
            <g key={i}>
              <line
                x1={xPos}
                y1={padding}
                x2={xPos}
                y2={height - padding}
                stroke="#ff9800"
                strokeWidth="2"
              />
              <circle cx={xPos} cy={padding + 10} r={6} fill="#ff9800" />
            </g>
          )
        })}

        {/* X axis labels */}
        {[-3, -2, -1, 0, 1, 2, 3].map((sigma) => {
          const xVal = mean + sigma * stdDev
          const xPos =
            padding + ((xVal - minX) / range) * (width - 2 * padding)
          return (
            <text
              key={sigma}
              x={xPos}
              y={height - padding + 20}
              textAnchor="middle"
              fontSize="12"
              fill="#666"
            >
              {xVal.toFixed(0)}
            </text>
          )
        })}
      </svg>

      <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 24, height: 2, bgcolor: 'primary.main' }} />
          <Typography variant="body2">正規分布</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{ width: 24, height: 2, borderTop: '2px dashed #f50057' }}
          />
          <Typography variant="body2">平均値</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 16,
              height: 16,
              bgcolor: 'rgba(33, 150, 243, 0.1)',
              border: '1px solid #2196f3',
            }}
          />
          <Typography variant="body2">±σ範囲</Typography>
        </Stack>
        {conditionMarks.length > 0 && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 24, height: 2, bgcolor: '#ff9800' }} />
            <Typography variant="body2">条件</Typography>
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}

// 計算結果コンポーネント
function CalculationResults({ result }: { result: EstimationResult }) {
  const formatNumber = (num: number, decimals = 2) => {
    return Number.isFinite(num) ? num.toFixed(decimals) : '-'
  }

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          推定パラメータ
        </Typography>

        {!result.isValid && result.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {result.error}
          </Alert>
        )}

        <Stack direction="row" spacing={2}>
          <Box
            sx={{
              flex: 1,
              p: 2,
              borderRadius: 1,
              bgcolor: result.estimatedFields.includes('平均値')
                ? 'info.light'
                : 'grey.100',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              平均値 (μ){' '}
              {result.estimatedFields.includes('平均値') && (
                <Chip label="推定" size="small" color="info" sx={{ ml: 1 }} />
              )}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {formatNumber(result.mean, 1)}
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              p: 2,
              borderRadius: 1,
              bgcolor: result.estimatedFields.includes('標準偏差')
                ? 'info.light'
                : 'grey.100',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              標準偏差 (σ){' '}
              {result.estimatedFields.includes('標準偏差') && (
                <Chip label="推定" size="small" color="info" sx={{ ml: 1 }} />
              )}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {formatNumber(result.stdDev, 2)}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {result.isValid && (
        <>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              分布の範囲
            </Typography>
            <Stack direction="row" spacing={2}>
              {[
                { label: 'μ ± σ', sigma: 1, percent: '68.3%' },
                { label: 'μ ± 2σ', sigma: 2, percent: '95.4%' },
                { label: 'μ ± 3σ', sigma: 3, percent: '99.7%' },
              ].map(({ label, sigma, percent }) => (
                <Box key={label} sx={{ flex: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="body1" fontFamily="monospace" fontSize="0.9rem">
                    {formatNumber(result.mean - sigma * result.stdDev, 1)} 〜{' '}
                    {formatNumber(result.mean + sigma * result.stdDev, 1)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ≈{percent}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              パーセンタイル表
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>パーセンタイル</TableCell>
                    <TableCell align="right">値</TableCell>
                    <TableCell>意味</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { p: 99, label: '上位1%' },
                    { p: 95, label: '上位5%' },
                    { p: 90, label: '上位10%' },
                    { p: 75, label: '上位25%' },
                    { p: 50, label: '中央値' },
                    { p: 25, label: '下位25%' },
                    { p: 10, label: '下位10%' },
                  ].map(({ p, label }) => (
                    <TableRow key={p}>
                      <TableCell>{p}%</TableCell>
                      <TableCell align="right">
                        {formatNumber(result.percentiles[p], 1)}
                      </TableCell>
                      <TableCell>{label}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {result.conditionsFit.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            条件の整合性チェック
          </Typography>
          <Stack spacing={1}>
            {result.conditionsFit.map((fit) => (
              <Box
                key={fit.id}
                sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}
              >
                <Typography variant="body2" fontWeight="medium">
                  {fit.label}
                </Typography>
                <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      入力値
                    </Typography>
                    <Typography fontWeight="medium">
                      {formatNumber(fit.expected, 1)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      計算値
                    </Typography>
                    <Typography fontWeight="medium">
                      {formatNumber(fit.actual, 1)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      誤差
                    </Typography>
                    <Typography
                      fontWeight="medium"
                      color={fit.error < 5 ? 'success.main' : 'warning.main'}
                    >
                      {formatNumber(fit.error, 1)}%
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      {result.warnings.length > 0 && (
        <Alert severity="warning">
          <Typography fontWeight="medium" gutterBottom>
            注意
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {result.warnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </Alert>
      )}
    </Stack>
  )
}

// 入力フォームコンポーネント
function InputForm({
  params,
  setParams,
}: {
  params: DistributionParams
  setParams: (params: DistributionParams) => void
}) {
  const [newCondType, setNewCondType] = useState<ConditionType>('value-percentage')

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
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
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
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
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

// 値の逆引きコンポーネント
function ValueLookup({
  mean,
  stdDev,
  isValid,
}: {
  mean: number
  stdDev: number
  isValid: boolean
}) {
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

// メインコンポーネント
const NormViewer = () => {
  const [params, setParams] = useState<DistributionParams>({
    conditions: [],
  })

  const result = useMemo(() => estimateDistribution(params), [params])

  // サンプル条件をセット
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
        <Button variant="outlined" size="small" onClick={setExample}>
          サンプルを入力
        </Button>
      </Box>

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
