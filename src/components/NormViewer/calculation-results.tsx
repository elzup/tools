import {
  Alert,
  Box,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { EstimationResult } from '../../lib/norm-estimator'

type Props = {
  result: EstimationResult
}

const formatNumber = (num: number, decimals = 2) => {
  return Number.isFinite(num) ? num.toFixed(decimals) : '-'
}

// 推定結果のサマリー（μ, σ + 範囲を1行で表示）
export function ResultSummary({ result }: Props) {
  if (!result.isValid) {
    return (
      <Paper sx={{ p: 1.5 }}>
        <Alert severity="info" sx={{ py: 0 }}>
          <Typography variant="caption">{result.error || '条件を入力してください'}</Typography>
        </Alert>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 1.5 }}>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        {/* μ と σ */}
        <Stack direction="row" spacing={1} alignItems="baseline">
          <Box
            sx={{
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: result.estimatedFields.includes('平均値') ? 'info.light' : 'grey.100',
            }}
          >
            <Typography variant="caption" color="text.secondary">μ</Typography>
            <Typography variant="body1" fontWeight="bold" component="span" sx={{ ml: 0.5 }}>
              {formatNumber(result.mean, 1)}
            </Typography>
          </Box>
          <Box
            sx={{
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: result.estimatedFields.includes('標準偏差') ? 'info.light' : 'grey.100',
            }}
          >
            <Typography variant="caption" color="text.secondary">σ</Typography>
            <Typography variant="body1" fontWeight="bold" component="span" sx={{ ml: 0.5 }}>
              {formatNumber(result.stdDev, 2)}
            </Typography>
          </Box>
        </Stack>

        {/* 簡略範囲 */}
        <Stack direction="row" spacing={1.5} sx={{ color: 'text.secondary' }}>
          <Typography variant="caption">
            68%: {formatNumber(result.mean - result.stdDev, 0)}〜{formatNumber(result.mean + result.stdDev, 0)}
          </Typography>
          <Typography variant="caption">
            95%: {formatNumber(result.mean - 2 * result.stdDev, 0)}〜{formatNumber(result.mean + 2 * result.stdDev, 0)}
          </Typography>
        </Stack>

        {/* 整合性 */}
        {result.conditionsFit.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            整合性:{' '}
            {result.conditionsFit.map((fit, i) => (
              <span key={fit.id}>
                {i > 0 && ' / '}
                <span style={{ color: fit.error < 5 ? '#2e7d32' : '#ed6c02' }}>
                  {formatNumber(fit.error, 1)}%
                </span>
              </span>
            ))}
          </Typography>
        )}
      </Stack>

      {result.warnings.length > 0 && (
        <Alert severity="warning" sx={{ py: 0, mt: 1 }}>
          {result.warnings.map((warn, i) => (
            <Typography key={i} variant="caption" display="block">
              {warn}
            </Typography>
          ))}
        </Alert>
      )}
    </Paper>
  )
}

// パーセンタイル表（折りたたみ式）
export function PercentileTable({ result }: Props) {
  const [showDetail, setShowDetail] = useState(false)

  if (!result.isValid) return null

  const basicPercentiles = [
    { p: 90, label: '10%' },
    { p: 75, label: '25%' },
    { p: 50, label: '50%' },
    { p: 25, label: '75%' },
    { p: 10, label: '90%' },
  ]

  const detailedPercentiles = [
    { p: 99, label: '1%' },
    { p: 97, label: '3%' },
    { p: 95, label: '5%' },
    { p: 90, label: '10%' },
    { p: 85, label: '15%' },
    { p: 80, label: '20%' },
    { p: 75, label: '25%' },
    { p: 70, label: '30%' },
    { p: 60, label: '40%' },
    { p: 50, label: '50%' },
    { p: 40, label: '60%' },
    { p: 30, label: '70%' },
    { p: 25, label: '75%' },
    { p: 20, label: '80%' },
    { p: 10, label: '90%' },
    { p: 5, label: '95%' },
    { p: 1, label: '99%' },
  ]

  const percentiles = showDetail ? detailedPercentiles : basicPercentiles

  // 詳細表示のパーセンタイル値を計算
  const getPercentileValue = (p: number) => {
    if (result.percentiles[p] !== undefined) {
      return result.percentiles[p]
    }
    // 計算で求める
    const z = p < 50
      ? -Math.abs(getZScore(p))
      : Math.abs(getZScore(p))
    return result.mean + z * result.stdDev
  }

  // 簡易的なz-score計算（近似）
  const getZScore = (p: number) => {
    // 正規分布の逆関数の近似
    const pNorm = p / 100
    if (pNorm <= 0 || pNorm >= 1) return 0

    // 既知の値を使用
    const known: Record<number, number> = {
      1: -2.326, 3: -1.881, 5: -1.645, 10: -1.282, 15: -1.036,
      20: -0.842, 25: -0.674, 30: -0.524, 40: -0.253, 50: 0,
      60: 0.253, 70: 0.524, 75: 0.674, 80: 0.842, 85: 1.036,
      90: 1.282, 95: 1.645, 97: 1.881, 99: 2.326,
    }
    return known[p] ?? 0
  }

  return (
    <Paper sx={{ p: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="subtitle2">パーセンタイル</Typography>
        <IconButton
          size="small"
          onClick={() => setShowDetail(!showDetail)}
          sx={{ fontSize: '0.75rem', p: 0.5 }}
        >
          {showDetail ? '簡易' : '詳細'}
        </IconButton>
      </Stack>
      <Collapse in={true}>
        <TableContainer>
          <Table size="small" sx={{ '& td, & th': { py: 0.2, px: 0.5 } }}>
            <TableBody>
              {percentiles.map(({ p, label }) => (
                <TableRow key={p}>
                  <TableCell sx={{ color: 'text.secondary', width: 60 }}>上位{label}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {formatNumber(getPercentileValue(p), 1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Collapse>
    </Paper>
  )
}

// 範囲詳細（グラフ下の詳細情報として使用可能）
export function RangeDetails({ result }: Props) {
  if (!result.isValid) return null

  return (
    <Paper sx={{ p: 1.5 }}>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        範囲詳細
      </Typography>
      <Stack spacing={0.3}>
        {[
          { label: '±σ', sigma: 1, central: '68.27%', top: '15.87%' },
          { label: '±2σ', sigma: 2, central: '95.45%', top: '2.28%' },
          { label: '±3σ', sigma: 3, central: '99.73%', top: '0.13%' },
        ].map(({ label, sigma, central, top }) => (
          <Stack key={label} direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" color="text.secondary" sx={{ width: 28 }}>
              {label}
            </Typography>
            <Typography variant="caption" fontFamily="monospace">
              {formatNumber(result.mean - sigma * result.stdDev, 1)} 〜{' '}
              {formatNumber(result.mean + sigma * result.stdDev, 1)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              中央{central}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              上位{top}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  )
}

// 後方互換性のため残す（使用箇所があれば）
export function CalculationResults({ result }: Props) {
  return (
    <Stack spacing={1}>
      <ResultSummary result={result} />
      <PercentileTable result={result} />
    </Stack>
  )
}
