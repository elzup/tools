import { useMemo, useState } from 'react'
import {
  Box,
  Paper,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material'
import styled from 'styled-components'
import {
  type ColorMap,
  type Params,
  SERIES,
  type SeriesKey,
  boxCox,
  formatCount,
  formatCrackTime,
  formatMultiplier,
  lambdaNote,
  seriesByKey,
  symAnyFactor,
  symAnyWinsFrom,
  toBits,
} from './space'
import { SpaceChart } from './SpaceChart'

const BASES = [
  { value: 10, label: '数字 10' },
  { value: 26, label: '英小 26' },
  { value: 52, label: '英大小 52' },
  { value: 62, label: '英数 62' },
]
const SYMBOL_POOLS = [
  { value: 32, label: 'ASCII 記号 32' },
  { value: 10, label: 'よく使う 10' },
]
const LAMBDA_PRESETS = [0, 0.08, 0.15, 0.3, 0.5, 1]
// λ=0.15 で「棒 2 倍 ≒ 約 100 倍」。差が見えつつ基準が潰れない落とし所
const DEFAULT_LAMBDA = 0.15
export const L_MIN = 4
export const L_MAX = 16
// GPU で MD5 等の高速ハッシュを攻撃する桁。bcrypt なら 5〜6 桁落ちる
const GUESSES_PER_SEC = 1e10

const useSeriesColors = (): ColorMap => {
  const { palette } = useTheme()
  return {
    base: { color: palette.text.secondary, opacity: 1 },
    symEnd: { color: palette.secondary.main, opacity: 0.5 },
    plus1: { color: palette.primary.main, opacity: 1 },
    symAny: { color: palette.secondary.main, opacity: 1 },
    brute: { color: palette.warning.main, opacity: 1 },
    plus2: { color: palette.primary.main, opacity: 0.4 },
  }
}

const PasswordSpace = () => {
  const [base, setBase] = useState(62)
  const [symbols, setSymbols] = useState(32)
  const [length, setLength] = useState(8)
  const [lambda, setLambda] = useState(DEFAULT_LAMBDA)
  const colors = useSeriesColors()
  const params: Params = { base, symbols, length }

  return (
    <Stack spacing={3}>
      <Controls
        base={base}
        symbols={symbols}
        length={length}
        lambda={lambda}
        onBase={setBase}
        onSymbols={setSymbols}
        onLength={setLength}
        onLambda={setLambda}
      />
      <Duel params={params} colors={colors} />
      <Section title="パターン数 (現在の L)">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          棒の長さは λ で変換した値、数値は実数。全探索時間は 10¹⁰ 回/秒 (GPU
          で高速ハッシュを攻撃する想定)。
        </Typography>
        <Bars params={params} lambda={lambda} colors={colors} />
      </Section>
      <Section title="長さごとの推移">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          縦軸は棒と同じ λ スケール。列をクリックで L を切り替え。
        </Typography>
        <Legend colors={colors} />
        <SpaceChart
          params={params}
          lambda={lambda}
          colors={colors}
          lMin={L_MIN}
          lMax={L_MAX}
          onSelectLength={setLength}
        />
      </Section>
      <Explain />
    </Stack>
  )
}

type ControlsProps = {
  base: number
  symbols: number
  length: number
  lambda: number
  onBase: (v: number) => void
  onSymbols: (v: number) => void
  onLength: (v: number) => void
  onLambda: (v: number) => void
}

const Controls = (p: ControlsProps) => (
  <Paper variant="outlined" sx={{ p: 2 }}>
    <ControlGrid>
      <Box>
        <CtlLabel>基本の文字種</CtlLabel>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={p.base}
          onChange={(_, v) => v !== null && p.onBase(v)}
        >
          {BASES.map((b) => (
            <ToggleButton key={b.value} value={b.value}>
              {b.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <Box>
        <CtlLabel>記号の候補数</CtlLabel>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={p.symbols}
          onChange={(_, v) => v !== null && p.onSymbols(v)}
        >
          {SYMBOL_POOLS.map((s) => (
            <ToggleButton key={s.value} value={s.value}>
              {s.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <Box>
        <CtlLabel>基準の長さ L = {p.length} 文字</CtlLabel>
        <Slider
          size="small"
          min={L_MIN}
          max={L_MAX}
          step={1}
          marks
          value={p.length}
          onChange={(_, v) => p.onLength(v as number)}
        />
      </Box>
      <Box>
        <CtlLabel>
          スケール λ ={' '}
          {p.lambda === 0 ? '0 (対数)' : p.lambda === 1 ? '1 (線形)' : p.lambda}
        </CtlLabel>
        <Slider
          size="small"
          min={0}
          max={1}
          step={0.01}
          value={p.lambda}
          onChange={(_, v) => p.onLambda(v as number)}
        />
        <ToggleButtonGroup
          size="small"
          exclusive
          value={p.lambda}
          onChange={(_, v) => v !== null && p.onLambda(v)}
        >
          {LAMBDA_PRESETS.map((v) => (
            <ToggleButton key={v} value={v} sx={{ py: 0.25 }}>
              {v === 0 ? '対数' : v === 1 ? '線形' : v === 0.5 ? '√' : v}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Typography variant="caption" color="text.secondary" display="block">
          {lambdaNote(p.lambda)}
        </Typography>
      </Box>
    </ControlGrid>
  </Paper>
)

const Duel = ({ params, colors }: { params: Params; colors: ColorMap }) => {
  const lnBase = seriesByKey('base').ln(params)
  const plus1 = seriesByKey('plus1').ln(params) - lnBase
  const symAny = seriesByKey('symAny').ln(params) - lnBase
  const symEnd = seriesByKey('symEnd').ln(params) - lnBase
  const ratio = Math.exp(symAny - plus1)
  const winsFrom = symAnyWinsFrom(params.base, params.symbols, L_MAX)
  const { base, symbols, length } = params

  return (
    <Section title="1 文字増やす vs 記号を 1 つ入れる">
      <DuelGrid>
        <Box>
          <Typography variant="caption" color="text.secondary">
            +1 文字 (同じ文字種)
          </Typography>
          <Big style={{ color: colors.plus1.color }}>
            {formatMultiplier(plus1)}
          </Big>
          <Typography variant="caption" color="text.secondary">
            b = {base}
          </Typography>
        </Box>
        <Typography color="text.secondary">vs</Typography>
        <Box>
          <Typography variant="caption" color="text.secondary">
            記号をどこか 1 か所に
          </Typography>
          <Big style={{ color: colors.symAny.color }}>
            {formatMultiplier(symAny)}
          </Big>
          <Typography variant="caption" color="text.secondary">
            {length + 1} か所 × {symbols} 種 = {symAnyFactor(params)} 通り
          </Typography>
        </Box>
      </DuelGrid>
      <Typography variant="body2" sx={{ mt: 2 }}>
        {ratio >= 1
          ? `L = ${length} では記号を 1 つ混ぜる方が ${ratio.toFixed(1)} 倍強い。末尾に付けるだけなら ${formatMultiplier(symEnd)} で、+1 文字の ${Math.exp(plus1 - symEnd).toFixed(1)} 分の 1。`
          : `L = ${length} では +1 文字の方が ${(1 / ratio).toFixed(1)} 倍強い。記号 ${symbols} 種 × 位置 ${length + 1} か所が b = ${base} を下回るため。`}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        記号の方が強くなる条件は s × (L+1) &gt; b。この設定では{' '}
        {winsFrom === null
          ? `L ≤ ${L_MAX} の範囲で逆転しない`
          : `L ≥ ${winsFrom}`}
        。
      </Typography>
    </Section>
  )
}

type BarsProps = { params: Params; lambda: number; colors: ColorMap }

// 変換後の値が 0 付近でも棒の存在が見えるように残す最小幅
const MIN_BAR_PCT = 0.3

const Bars = ({ params, lambda, colors }: BarsProps) => {
  const rows = useMemo(() => {
    const lns = SERIES.map((s) => s.ln(params))
    const fmax = Math.max(...lns.map((v) => boxCox(v, lambda)))
    return SERIES.map((s, i) => ({
      series: s,
      ln: lns[i],
      pct: Math.max(MIN_BAR_PCT, (boxCox(lns[i], lambda) / fmax) * 100),
      mult: i === 0 ? '基準' : formatMultiplier(lns[i] - lns[0]),
    }))
  }, [params, lambda])

  return (
    <Stack spacing={1.5}>
      {rows.map(({ series, ln, pct, mult }) => (
        <BarRow key={series.key}>
          <Box>
            <Typography
              variant="body2"
              fontWeight={isFocus(series.key) ? 700 : 400}
            >
              {series.name}
            </Typography>
            <Mono>{series.formula}</Mono>
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Track>
              <Fill
                style={{
                  width: `${pct}%`,
                  background: colors[series.key].color,
                  opacity: colors[series.key].opacity,
                }}
              />
            </Track>
            <Meta>
              <b>{formatCount(ln)}</b> 通り{' '}
              <span>{toBits(ln).toFixed(1)} bit</span>
              <span style={{ color: colors.plus1.color }}>{mult}</span>
              <span>全探索 {formatCrackTime(ln, GUESSES_PER_SEC)}</span>
            </Meta>
          </Box>
        </BarRow>
      ))}
    </Stack>
  )
}

const isFocus = (key: SeriesKey) => key === 'plus1' || key === 'symAny'

const Legend = ({ colors }: { colors: ColorMap }) => (
  <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mb: 1 }}>
    {SERIES.map((s) => (
      <Typography key={s.key} variant="caption" color="text.secondary">
        <Swatch
          style={{
            background: colors[s.key].color,
            opacity: colors[s.key].opacity,
          }}
        />
        {s.name}
      </Typography>
    ))}
  </Stack>
)

const Explain = () => (
  <Section title="読み方">
    <Typography component="ul" variant="body2" sx={{ pl: 2, m: 0 }}>
      <li>+1 文字は文字種 b 倍。英数なら常に ×62。</li>
      <li>
        記号をどこか 1 か所に入れると「記号の種類 s × 入れる位置
        L+1」倍。位置の自由度が効くので長いほど得をする。記号はちょうど 1
        つなので、位置と記号が違えば必ず別の文字列になり二重に数えない。
      </li>
      <li>
        末尾に記号を付けるだけなら
        ×s。人が付ける記号は末尾の「!」に偏るので、攻撃者の辞書ルールではこちらに近い。
      </li>
      <li>
        記号込みで総当たりは、攻撃者が構造を知らない場合の上限。強度チェッカーが出しがちな値で、記号
        1 つの効果を大きく見せる。
      </li>
      <li>
        λ は Box-Cox 変換 (N^λ − 1)/λ。λ=1 で線形、λ→0 で ln N
        に一致するので、途中の値は線形と指数の中間として連続につながる。
      </li>
    </Typography>
  </Section>
)

const Section = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <Paper variant="outlined" sx={{ p: 2 }}>
    <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
      {title}
    </Typography>
    {children}
  </Paper>
)

const ControlGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px 28px;
  .MuiToggleButtonGroup-root {
    flex-wrap: wrap;
  }
`
const CtlLabel = styled.div`
  font-size: 12px;
  opacity: 0.75;
  margin-bottom: 4px;
`
const DuelGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: center;
  text-align: center;
  > div {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
`
const Big = styled.div`
  font-size: clamp(26px, 6vw, 36px);
  font-weight: 700;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
`
const BarRow = styled.div`
  display: grid;
  grid-template-columns: 190px 1fr;
  gap: 4px 16px;
  align-items: center;
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`
const Mono = styled.code`
  font-size: 11px;
  opacity: 0.7;
`
const Track = styled.div`
  position: relative;
  height: 22px;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(127, 127, 127, 0.15);
`
const Fill = styled.div`
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 4px;
  transition: width 0.35s ease;
`
const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  margin-top: 2px;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  opacity: 0.85;
  b {
    font-weight: 600;
  }
`
const Swatch = styled.span`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 6px;
  vertical-align: -1px;
`

export default PasswordSpace
