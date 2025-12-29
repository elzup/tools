import {
  Alert,
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { EstimationResult } from '../../lib/norm-estimator'

type Props = {
  result: EstimationResult
}

export function CalculationResults({ result }: Props) {
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
                <Box
                  key={label}
                  sx={{ flex: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography
                    variant="body1"
                    fontFamily="monospace"
                    fontSize="0.9rem"
                  >
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
