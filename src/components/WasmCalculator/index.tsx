import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { type BenchmarkResult, runBenchmark } from './benchmark'

const DEFAULT_EXPRESSION = '(1 + 2) * 3.141592653589793 / 7'
const EXPONENTS = [4, 5, 6, 7, 8]
const PRESETS = [
  '0.1 + 0.2',
  '(12345.6789 * 9876.54321) / 3.14159',
  '((1 + 2) * (3 + 4) - 5) / 6',
]

const formatDuration = (milliseconds: number) => {
  if (milliseconds < 1) return `${milliseconds.toFixed(3)} ms`
  if (milliseconds < 100) return `${milliseconds.toFixed(2)} ms`
  return `${milliseconds.toFixed(1)} ms`
}

const formatOps = (opsPerSecond: number) =>
  `${new Intl.NumberFormat('ja-JP', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(opsPerSecond)} ops/s`

const formatChecksum = (checksum: number) =>
  Number.isFinite(checksum) ? checksum.toPrecision(12) : String(checksum)

type EngineCardProps = {
  label: string
  medianMs: number
  opsPerSecond: number
  samplesMs: number[]
  maxOpsPerSecond: number
  color: 'primary' | 'secondary'
}

const EngineCard = ({
  label,
  medianMs,
  opsPerSecond,
  samplesMs,
  maxOpsPerSecond,
  color,
}: EngineCardProps) => (
  <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 0 }}>
    <Typography variant="overline" color={`${color}.main`}>
      {label}
    </Typography>
    <Typography variant="h4" component="div">
      {formatDuration(medianMs)}
    </Typography>
    <Typography variant="body1" fontWeight={700} gutterBottom>
      {formatOps(opsPerSecond)}
    </Typography>
    <LinearProgress
      variant="determinate"
      color={color}
      value={(opsPerSecond / maxOpsPerSecond) * 100}
      sx={{ height: 8, borderRadius: 4, my: 1 }}
    />
    <Typography variant="caption" color="text.secondary">
      samples: {samplesMs.map((sample) => formatDuration(sample)).join(' / ')}
    </Typography>
  </Paper>
)

const ResultPanel = ({ result }: { result: BenchmarkResult }) => {
  const maxOpsPerSecond = Math.max(
    result.javascript.opsPerSecond,
    result.wasm.opsPerSecond
  )
  const winner =
    result.wasmSpeedup >= 1
      ? `Wasm が ${result.wasmSpeedup.toFixed(2)}× 高速`
      : `JavaScript が ${(1 / result.wasmSpeedup).toFixed(2)}× 高速`

  return (
    <Stack spacing={2} role="status" aria-live="polite">
      <Paper sx={{ p: 2, bgcolor: 'action.hover' }} elevation={0}>
        <Typography variant="h5" component="div" fontWeight={700}>
          {winner}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {result.iterations.toLocaleString()} 回 × {result.sampleCount}{' '}
          サンプルの中央値
        </Typography>
      </Paper>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <EngineCard
          label="JavaScript"
          medianMs={result.javascript.medianMs}
          opsPerSecond={result.javascript.opsPerSecond}
          samplesMs={result.javascript.samplesMs}
          maxOpsPerSecond={maxOpsPerSecond}
          color="primary"
        />
        <EngineCard
          label="WebAssembly"
          medianMs={result.wasm.medianMs}
          opsPerSecond={result.wasm.opsPerSecond}
          samplesMs={result.wasm.samplesMs}
          maxOpsPerSecond={maxOpsPerSecond}
          color="secondary"
        />
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2">
          Wasm コンパイル: {formatDuration(result.wasmCompilationMs)} (
          {result.wasmByteLength} bytes、実行時間には含めない)
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
        >
          checksum — JS: {formatChecksum(result.javascript.checksum)} / Wasm:{' '}
          {formatChecksum(result.wasm.checksum)}
        </Typography>
        {!result.hasMatchingChecksum && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            両エンジンの計算結果が一致しませんでした。速度だけでなく式も確認してください。
          </Alert>
        )}
      </Paper>
    </Stack>
  )
}

const WasmCalculator = () => {
  const [expression, setExpression] = useState(DEFAULT_EXPRESSION)
  const [exponent, setExponent] = useState(6)
  const [result, setResult] = useState<BenchmarkResult | null>(null)
  const [error, setError] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  const handleRun = async () => {
    setIsRunning(true)
    setError('')
    setResult(null)

    // 同期ループで UI が止まる前に、実行中表示をブラウザへ描画させる。
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

    try {
      setResult(await runBenchmark(expression, exponent))
    } catch (cause) {
      console.error('Calculation benchmark failed', cause)
      setError(
        cause instanceof Error ? cause.message : 'ベンチマークに失敗しました'
      )
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="body1">
            同じ計算式を JavaScript と WebAssembly で 10<sup>n</sup>{' '}
            回実行し、速度を比較します。
          </Typography>

          <TextField
            label="計算式"
            value={expression}
            onChange={(event) => setExpression(event.target.value)}
            helperText="使用可能: 数値、+、-、*、/、括弧（200文字まで）"
            fullWidth
            inputProps={{ spellCheck: false }}
          />

          <Box>
            <Typography variant="caption" color="text.secondary">
              例
            </Typography>
            <Stack direction="row" gap={1} flexWrap="wrap" mt={0.5}>
              {PRESETS.map((preset) => (
                <Chip
                  key={preset}
                  label={preset}
                  onClick={() => setExpression(preset)}
                  variant="outlined"
                />
              ))}
            </Stack>
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems="stretch"
          >
            <TextField
              select
              label="繰り返し回数"
              value={exponent}
              onChange={(event) => setExponent(Number(event.target.value))}
              sx={{ minWidth: 180 }}
            >
              {EXPONENTS.map((value) => (
                <MenuItem key={value} value={value}>
                  10^{value} ({(10 ** value).toLocaleString()} 回)
                </MenuItem>
              ))}
            </TextField>
            <Button
              onClick={handleRun}
              disabled={isRunning}
              size="large"
              sx={{ flex: 1 }}
            >
              {isRunning ? '計測中…' : 'ベンチマーク実行'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {isRunning && <LinearProgress aria-label="ベンチマーク計測中" />}
      {error !== '' && <Alert severity="error">{error}</Alert>}
      {result !== null && <ResultPanel result={result} />}

      <Alert severity="info">
        式は両エンジン向けに同じ演算列へコンパイルし、事前ウォームアップ後に交互順で計測します。
        Wasm 呼び出し境界の速度ではなく、ループを含む計算本体の比較です。
      </Alert>
    </Stack>
  )
}

export default WasmCalculator
