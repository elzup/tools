import { useState } from 'react'
import {
  Box,
  TextField,
  Typography,
  Paper,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import styled from 'styled-components'

const CLASSIC_EXAMPLES = [
  { expr: '0.1 + 0.2', expected: 0.3 },
  { expr: '0.3 - 0.1', expected: 0.2 },
  { expr: '0.1 * 3', expected: 0.3 },
  { expr: '0.6 / 0.2', expected: 3 },
  { expr: '1e15 + 1.1 - 1e15', expected: 1.1 },
  { expr: '9999999999999999', expected: 9999999999999999 },
  { expr: '0.1 + 0.7', expected: 0.8 },
] as const

function evalExpr(expr: string): number {
  // eslint-disable-next-line no-eval
  return Function(`"use strict"; return (${expr})`)() as number
}

type BinaryParts = {
  sign: string
  exponent: string
  mantissa: string
  full: string
}

function toBinaryParts(n: number): BinaryParts {
  const buf = new ArrayBuffer(8)
  new Float64Array(buf)[0] = n
  const view = new DataView(buf)
  const hi = view.getUint32(0).toString(2).padStart(32, '0')
  const lo = view.getUint32(4).toString(2).padStart(32, '0')
  const bits = lo + hi
  const sign = bits[0]
  const exponent = bits.slice(1, 12)
  const mantissa = bits.slice(12)
  return { sign, exponent, mantissa, full: `${sign} ${exponent} ${mantissa}` }
}

function exponentValue(expBits: string): number {
  return parseInt(expBits, 2) - 1023
}

function BinaryExplain({ value }: { value: number }) {
  if (isNaN(value) || !isFinite(value)) return null
  const parts = toBinaryParts(value)
  const exp = exponentValue(parts.exponent)
  return (
    <Box className="binary-explain" sx={{ mt: 0.5 }}>
      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
        <span className="bin-sign">{parts.sign}</span>{' '}
        <span className="bin-exp">{parts.exponent}</span>{' '}
        <span className="bin-mantissa">{parts.mantissa}</span>
      </Typography>
      <Typography variant="caption" color="textSecondary">
        符号: {parts.sign === '0' ? '+' : '-'} / 指数: {exp} (bias除去:{' '}
        {parseInt(parts.exponent, 2)} - 1023) / 仮数: 52bit
      </Typography>
    </Box>
  )
}

function findPrecisionBoundary(base: number): {
  safe: number
  unsafe: number
} {
  let n = base
  while (n + 1 !== n) {
    n *= 2
  }
  return { safe: n / 2, unsafe: n }
}

const FloatPrecision = () => {
  const [customExpr, setCustomExpr] = useState('0.1 + 0.2')
  const [sliderExp, setSliderExp] = useState(0)

  const customResult = (() => {
    try {
      return evalExpr(customExpr)
    } catch {
      return NaN
    }
  })()

  const magnitude = 10 ** sliderExp
  const nearbyValues = [-2, -1, 0, 1, 2].map((offset) => {
    const val = magnitude + offset * Number.EPSILON * magnitude
    return { offset, value: val, diff: val - magnitude }
  })

  const boundary = findPrecisionBoundary(1)

  return (
    <Style>
      <section>
        <Typography variant="h6">0. IEEE 754 double の構成</Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body2" gutterBottom>
            JavaScript の Number は IEEE 754 倍精度浮動小数点数 (64bit) です。
          </Typography>
          <Box className="binary-explain" sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              <span className="bin-sign">0</span>{' '}
              <span className="bin-exp">00000000000</span>{' '}
              <span className="bin-mantissa">
                0000000000000000000000000000000000000000000000000000
              </span>
            </Typography>
          </Box>
          <Typography variant="body2">
            <span className="bin-sign">符号 (1bit)</span>: 0 = 正, 1 = 負
          </Typography>
          <Typography variant="body2">
            <span className="bin-exp">指数 (11bit)</span>: 2の何乗か (bias:
            1023を引いた値が実際の指数)
          </Typography>
          <Typography variant="body2">
            <span className="bin-mantissa">仮数 (52bit)</span>: 有効数字 (先頭の
            1 は省略 = ケチ表現)
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            値 = (-1)^符号 × 2^(指数-1023) × (1 + 仮数/2^52)
          </Typography>
        </Paper>
      </section>

      <section>
        <Typography variant="h6">1. 精度の限界を探る</Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          スライダーで桁数を変えると指数部が変化し、同じ仮数52bitで表せる精度が変わる
        </Typography>
        <Box px={2}>
          <Typography variant="body2">
            基準値: 10^{sliderExp} = {magnitude.toExponential()}
          </Typography>
          <BinaryExplain value={magnitude} />
          <Slider
            value={sliderExp}
            onChange={(_, v) => setSliderExp(v as number)}
            min={0}
            max={20}
            step={1}
            marks
            valueLabelDisplay="auto"
          />
        </Box>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>offset (eps倍)</TableCell>
                <TableCell>値</TableCell>
                <TableCell>基準値との差</TableCell>
                <TableCell>2進表現</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {nearbyValues.map(({ offset, value, diff }) => (
                <TableRow key={offset}>
                  <TableCell>{offset}</TableCell>
                  <TableCell>
                    <code>{value.toFixed(20)}</code>
                  </TableCell>
                  <TableCell className={diff === 0 ? 'mismatch' : ''}>
                    <code>{diff}</code>
                  </TableCell>
                  <TableCell>
                    <BinaryExplain value={value} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </section>

      <section>
        <Typography variant="h6">2. 自由入力で試す</Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          JavaScript の式を入力して結果を確認
        </Typography>
        <TextField
          fullWidth
          label="式を入力"
          value={customExpr}
          onChange={(e) => setCustomExpr(e.target.value)}
          size="small"
          variant="outlined"
        />
        <Box mt={1}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2">
              結果: <code>{String(customResult)}</code>
            </Typography>
            <BinaryExplain value={customResult} />
          </Paper>
        </Box>
      </section>

      <section>
        <Typography variant="h6">3. 有名な浮動小数点トラップ</Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          期待値と実際の計算結果を比較。2進表現で誤差の原因を確認しよう
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>式</TableCell>
                <TableCell>期待値</TableCell>
                <TableCell>実際の結果</TableCell>
                <TableCell>一致?</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {CLASSIC_EXAMPLES.map(({ expr, expected }) => {
                const actual = evalExpr(expr)
                const isMatch = actual === expected
                return (
                  <TableRow key={expr}>
                    <TableCell>
                      <code>{expr}</code>
                    </TableCell>
                    <TableCell>{String(expected)}</TableCell>
                    <TableCell className={isMatch ? '' : 'mismatch'}>
                      <div>{String(actual)}</div>
                      <BinaryExplain value={actual} />
                    </TableCell>
                    <TableCell>{isMatch ? 'OK' : 'NG'}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </section>

      <section>
        <Typography variant="h6">4. n + 1 === n になる境界</Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          仮数部52bitを使い切ると、+1 が仮数の最下位ビットより小さくなり無視される
        </Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body2">
            Number.MAX_SAFE_INTEGER: <code>{Number.MAX_SAFE_INTEGER}</code> (2^
            53 - 1)
          </Typography>
          <BinaryExplain value={Number.MAX_SAFE_INTEGER} />

          <Box mt={1}>
            <Typography variant="body2">
              n + 1 !== n の最大 n: <code>{boundary.safe}</code>
            </Typography>
            <BinaryExplain value={boundary.safe} />
          </Box>

          <Box mt={1}>
            <Typography variant="body2">
              n + 1 === n の最小 n: <code>{boundary.unsafe}</code>
            </Typography>
            <BinaryExplain value={boundary.unsafe} />
          </Box>

          <Box mt={1}>
            <Typography variant="body2" color="textSecondary">
              検証: {boundary.unsafe} + 1 ==={' '}
              {boundary.unsafe + 1 === boundary.unsafe ? 'true' : 'false'} (同じ
              = 精度不足)
            </Typography>
            <Typography variant="caption" color="textSecondary">
              指数部が53以上になると、仮数52bitでは1の位を表現できなくなる
            </Typography>
          </Box>
        </Paper>
      </section>

      <section>
        <Typography variant="h6">5. 定数一覧</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableBody>
              {(
                [
                  ['Number.EPSILON', Number.EPSILON],
                  ['Number.MAX_SAFE_INTEGER', Number.MAX_SAFE_INTEGER],
                  ['Number.MIN_SAFE_INTEGER', Number.MIN_SAFE_INTEGER],
                  ['Number.MAX_VALUE', Number.MAX_VALUE],
                  ['Number.MIN_VALUE', Number.MIN_VALUE],
                ] as const
              ).map(([label, value]) => (
                <TableRow key={String(label)}>
                  <TableCell>
                    <code>{String(label)}</code>
                  </TableCell>
                  <TableCell>
                    <code>{String(value)}</code>
                  </TableCell>
                  <TableCell>
                    <BinaryExplain value={value as number} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </section>
    </Style>
  )
}

const Style = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;

  section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  code {
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 0.85rem;
  }

  .mismatch {
    background-color: rgba(255, 100, 100, 0.15);
    font-weight: bold;
  }

  .binary-explain {
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 0.8rem;
  }

  .bin-sign {
    color: #e91e63;
    font-weight: bold;
  }

  .bin-exp {
    color: #2196f3;
    font-weight: bold;
  }

  .bin-mantissa {
    color: #4caf50;
  }
`

export default FloatPrecision
