import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  FormControlLabel,
  Switch,
} from '@mui/material'
import styled from 'styled-components'
import {
  calculateWeekday,
  MONTH_CODES,
  type WeekdayResult,
  type WeekdayStep,
} from './weekdayCalc'

// floor(y/4) mod 7 の早見表 (y%7 は暗算で足す)
const _YEAR_DIV4_MOD7: number[] = Array.from(
  { length: 100 },
  (_, y) => Math.floor(y / 4) % 7
)

// ノードとテーブルの対応色
const NODE_COLORS: Record<string, string> = {
  century_code: '#4caf50',
  year_extract: '#2196f3',
  year_div4: '#2196f3',
  month_code: '#ff9800',
  day: '#bdbdbd',
}

const WEEKDAY_COLORS = [
  '#e53935', // Sun
  '#333',
  '#333',
  '#333',
  '#333',
  '#333',
  '#1565c0', // Sat
]

const todayStr = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type RevealNodeProps = {
  testMode: boolean
  className?: string
  sx?: Record<string, unknown>
  masked: React.ReactNode
  children: React.ReactNode
  onReveal?: () => void
}

const RevealNode = ({
  testMode,
  className,
  sx,
  masked,
  children,
  onReveal,
}: RevealNodeProps) => {
  const [revealed, setRevealed] = useState(false)
  const isHidden = testMode && !revealed

  return (
    <Box
      className={`${className ?? ''} ${isHidden ? 'node--masked' : ''}`}
      sx={sx}
      onClick={() => {
        if (testMode) {
          setRevealed((v) => {
            if (!v && onReveal) onReveal()
            return !v
          })
        }
      }}
    >
      {isHidden ? masked : children}
    </Box>
  )
}

// 6 は -1 としても表記
const CODE_LABEL = (code: number) => (code === 6 ? '6/-1' : `${code}`)

// 覚え方グループ: 同じグループは同色で表示
const MONTH_MEMO_GROUP: Record<number, string> = {
  1: 'zero', // 1,10月=0
  10: 'zero',
  4: 'swap', // 4月=6 ↔ 6月=4
  6: 'swap',
  2: 'three', // 2,3月=3 → 4月=3+3=6
  3: 'three',
  9: 'chain', // 9,12月=5 → 5月=1 → 1月=0
  12: 'chain',
  5: 'chain',
  11: 'solo3', // 11月=3
  7: 'memorize', // 暗記
  8: 'memorize',
}

const MonthCodeGrid = ({ borderColor }: { borderColor: string }) => (
  <Paper elevation={0} sx={{ border: `2px solid ${borderColor}`, p: 0.5 }}>
    <Typography
      variant="caption"
      sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}
    >
      月コード (m)
    </Typography>
    <Box className="mcode-grid">
      {/* ヘッダ行: 0-6 */}
      <Box className="mcode-cell mcode-header" />
      {Array.from({ length: 7 }, (_, i) => (
        <Box key={i} className="mcode-cell mcode-header">
          {CODE_LABEL(i)}
        </Box>
      ))}
      {/* 各月の行 */}
      {Array.from({ length: 12 }, (_, i) => {
        const month = i + 1
        const code = MONTH_CODES[month]
        const group = MONTH_MEMO_GROUP[month]
        return (
          <>
            <Box key={`m${month}`} className="mcode-cell mcode-month">
              {month}月
            </Box>
            {Array.from({ length: 7 }, (_, c) => (
              <Box
                key={`${month}-${c}`}
                className={`mcode-cell ${c === code ? `mcode-active mcode-g-${group}` : ''}`}
              >
                {c === code ? code : ''}
              </Box>
            ))}
          </>
        )
      })}
    </Box>
    <Box className="mcode-legend">
      <span className="mcode-leg mcode-g-zero">0: 1,10月</span>
      <span className="mcode-leg mcode-g-swap">swap: 4↔6</span>
      <span className="mcode-leg mcode-g-three">3: 2,3月→4月=6</span>
      <span className="mcode-leg mcode-g-chain">chain: 9,12→5→1</span>
      <span className="mcode-leg mcode-g-solo3">3: 11月</span>
      <span className="mcode-leg mcode-g-memorize">暗記: 7,8月</span>
    </Box>
  </Paper>
)

const WeekdayCalcExplainer = () => {
  const [dateInput, setDateInput] = useState(todayStr())
  const [result, setResult] = useState<WeekdayResult | null>(() =>
    calculateWeekday(todayStr())
  )
  const [error, setError] = useState('')
  const [testMode, setTestMode] = useState(false)
  // テストモード切り替え or 再計算で revealed をリセットするための key
  const [testKey, setTestKey] = useState(0)

  // ストップウォッチ
  const [swStartTime, setSwStartTime] = useState<number | null>(null)
  const [swElapsed, setSwElapsed] = useState<number | null>(null)
  const [swRunning, setSwRunning] = useState(false)
  const swIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [swHistory, setSwHistory] = useState<
    { date: string; elapsed: number }[]
  >([])
  const swDateRef = useRef<string>('')

  const stopStopwatch = useCallback(() => {
    if (swIntervalRef.current !== null) {
      clearInterval(swIntervalRef.current)
      swIntervalRef.current = null
    }
    setSwRunning((wasRunning) => {
      if (wasRunning) {
        const finalElapsed = swStartTime !== null ? Date.now() - swStartTime : 0
        setSwElapsed(finalElapsed)
        if (finalElapsed < 60_000) {
          setSwHistory((prev) => [
            ...prev,
            { date: swDateRef.current, elapsed: finalElapsed },
          ])
        }
      }
      return false
    })
  }, [swStartTime])

  const startStopwatch = useCallback(() => {
    stopStopwatch()
    const now = Date.now()
    setSwStartTime(now)
    setSwElapsed(0)
    setSwRunning(true)
    swIntervalRef.current = setInterval(() => {
      setSwElapsed(Date.now() - now)
    }, 10)
  }, [stopStopwatch])

  useEffect(() => {
    return () => {
      if (swIntervalRef.current !== null) clearInterval(swIntervalRef.current)
    }
  }, [])

  const handleCalc = () => {
    const r = calculateWeekday(dateInput)
    if (r === null) {
      setError('無効な日付です (対応範囲: 1500-01-01 ~ 2599-12-31)')
      setResult(null)
      return
    }
    setError('')
    setResult(r)
    setTestKey((k) => k + 1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCalc()
  }

  const handleRandom = () => {
    const minDate = new Date(1582, 9, 15).getTime()
    const maxDate = new Date(2582, 9, 15).getTime()
    const d = new Date(minDate + Math.random() * (maxDate - minDate))
    const str = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
    setDateInput(str)
    const r = calculateWeekday(str)
    if (r) {
      setError('')
      setResult(r)
      setTestKey((k) => k + 1)
      if (testMode) {
        swDateRef.current = str
        startStopwatch()
      }
    }
  }

  const renderBranchCol = (step: WeekdayStep) => {
    const mod7Val = ((step.value % 7) + 7) % 7
    const needsMod = step.value >= 7
    return (
      <Box key={step.name} className="flow-branch-col">
        <RevealNode
          testMode={testMode}
          className="flow-node flow-node--calc"
          sx={{ borderColor: `${NODE_COLORS[step.name]} !important` }}
          masked={
            <Typography variant="caption" className="flow-label">
              {step.label}
            </Typography>
          }
        >
          <Typography variant="caption" className="flow-label">
            {step.label}
          </Typography>
          <Typography variant="h5" className="flow-value">
            {step.value}
          </Typography>
          <Typography variant="caption" className="flow-explain">
            {step.explain}
          </Typography>
        </RevealNode>
        {needsMod ? (
          <>
            <Box className="flow-arrow flow-arrow--small" />
            <RevealNode
              testMode={testMode}
              className="flow-node flow-node--mod7-pre"
              masked={
                <Typography variant="caption" className="flow-label">
                  %7
                </Typography>
              }
            >
              <Typography variant="caption" className="flow-label">
                %7
              </Typography>
              <Typography variant="body1" className="flow-value">
                {mod7Val}
              </Typography>
            </RevealNode>
          </>
        ) : (
          <Box className="flow-spacer" />
        )}
      </Box>
    )
  }

  return (
    <Style>
      <Box className="input-section">
        <TextField
          label="日付 (YYYY/MM/DD)"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
          onKeyDown={handleKeyDown}
          size="small"
          sx={{ width: 200 }}
        />
        <Button variant="contained" onClick={handleCalc}>
          Explain
        </Button>
        <Button variant="outlined" onClick={handleRandom} size="small">
          Random
        </Button>
        <FormControlLabel
          control={
            <Switch
              checked={testMode}
              onChange={() => {
                setTestMode((v) => !v)
                setTestKey((k) => k + 1)
                stopStopwatch()
                setSwElapsed(null)
                setSwHistory([])
              }}
              color="secondary"
              size="small"
            />
          }
          label="Test"
        />
        {testMode && swElapsed !== null && (
          <Box
            className={`stopwatch ${swRunning ? 'stopwatch--running' : 'stopwatch--stopped'}`}
          >
            <Typography
              variant="h6"
              sx={{
                fontVariantNumeric: 'tabular-nums',
                fontFamily: 'monospace',
              }}
            >
              {(swElapsed / 1000).toFixed(2)}s
            </Typography>
          </Box>
        )}
      </Box>

      {testMode && swHistory.length > 0 && (
        <Box className="sw-history">
          <Box className="sw-history-list">
            {[...swHistory].reverse().map((h, i) => (
              <Box key={swHistory.length - 1 - i} className="sw-history-item">
                <span className="sw-history-no">#{swHistory.length - i}</span>
                <span className="sw-history-date">{h.date}</span>
                <span className="sw-history-time">
                  {(h.elapsed / 1000).toFixed(2)}s
                </span>
              </Box>
            ))}
          </Box>
          {swHistory.length >= 2 && (
            <Typography variant="caption" sx={{ color: '#757575' }}>
              avg:{' '}
              {(
                swHistory.reduce((s, h) => s + h.elapsed, 0) /
                swHistory.length /
                1000
              ).toFixed(2)}
              s{' / '}best:{' '}
              {(Math.min(...swHistory.map((h) => h.elapsed)) / 1000).toFixed(2)}
              s{' / '}
              {swHistory.length}回
            </Typography>
          )}
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {result && (
        <Box key={testKey}>
          <RevealNode
            testMode={testMode}
            className="result-card"
            onReveal={stopStopwatch}
            masked={
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {result.input}
              </Typography>
            }
          >
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {result.input}
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 'bold',
                color: WEEKDAY_COLORS[result.weekdayIndex],
              }}
            >
              {result.weekday}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Chip
                label={`${result.month}月`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={result.isLeapYear ? '閏年' : '平年'}
                color={result.isLeapYear ? 'info' : 'default'}
                size="small"
                variant={result.isLeapYear ? 'filled' : 'outlined'}
              />
              {result.leapAdjust !== 0 && (
                <Chip label="閏年補正 −1" color="warning" size="small" />
              )}
            </Box>
          </RevealNode>

          <Box className="formula-section">
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              公式: w = (D + m + y + floor(y/4) + C) mod 7
            </Typography>
          </Box>

          <Box className="main-content">
            <Box className="flowchart">
              {/* 入力ノード */}
              <Box className="flow-node flow-node--input">
                <Typography variant="body2" className="flow-label">
                  入力日付
                </Typography>
                <Typography variant="h6" className="flow-value">
                  {result.input}
                </Typography>
              </Box>
              <Box className="flow-arrow" />

              {/* 分岐: C, 年コード(y+⌊y/4⌋), m, D を並列表示 */}
              <Box className="flow-branch">
                {/* C */}
                {renderBranchCol(result.steps[0])}

                {/* Year group: y + floor(y/4) → 年コード */}
                <Box className="flow-branch-year-group">
                  <Box className="flow-branch-year-pair">
                    {renderBranchCol(result.steps[1])}
                    {renderBranchCol(result.steps[2])}
                  </Box>
                  <Box className="flow-year-merge">
                    <Box className="flow-merge-line" />
                    <Box className="flow-merge-line" />
                  </Box>
                  <Box className="flow-arrow flow-arrow--small" />
                  <RevealNode
                    testMode={testMode}
                    className="flow-node flow-node--year-combined"
                    sx={{
                      borderColor: `${NODE_COLORS.year_extract} !important`,
                    }}
                    masked={
                      <Typography variant="caption" className="flow-label">
                        年コード
                      </Typography>
                    }
                  >
                    <Typography variant="caption" className="flow-label">
                      年コード (y+⌊y/4⌋)%7
                    </Typography>
                    <Typography variant="h5" className="flow-value">
                      {(((result.steps[1].value + result.steps[2].value) % 7) +
                        7) %
                        7}
                    </Typography>
                    <Typography variant="caption" className="flow-explain">
                      ({result.steps[1].value} + {result.steps[2].value}) % 7 ={' '}
                      {(((result.steps[1].value + result.steps[2].value) % 7) +
                        7) %
                        7}
                    </Typography>
                  </RevealNode>
                </Box>

                {/* m */}
                {renderBranchCol(result.steps[3])}

                {/* D */}
                {renderBranchCol(result.steps[4])}
              </Box>

              {/* 合流矢印 */}
              <Box className="flow-merge-arrows">
                {['century', 'year', 'month', 'day'].map((k) => (
                  <Box key={k} className="flow-merge-line" />
                ))}
              </Box>
              <Box className="flow-arrow" />

              {/* 合計ノード */}
              {result.steps
                .filter((s) => s.name === 'sum')
                .map((step) => (
                  <RevealNode
                    key={step.name}
                    testMode={testMode}
                    className="flow-node flow-node--sum"
                    masked={
                      <Typography variant="body2" className="flow-label">
                        {step.label}
                      </Typography>
                    }
                  >
                    <Typography variant="body2" className="flow-label">
                      {step.label}
                    </Typography>
                    <Typography variant="h4" className="flow-value">
                      {step.value}
                    </Typography>
                    <Typography variant="caption" className="flow-explain">
                      {step.explain}
                    </Typography>
                  </RevealNode>
                ))}
              <Box className="flow-arrow" />

              {/* mod7 ノード */}
              {result.steps
                .filter((s) => s.name === 'mod7')
                .map((step) => (
                  <RevealNode
                    key={step.name}
                    testMode={testMode}
                    className="flow-node flow-node--mod"
                    masked={
                      <Typography variant="body2" className="flow-label">
                        {step.label}
                      </Typography>
                    }
                  >
                    <Typography variant="body2" className="flow-label">
                      {step.label}
                    </Typography>
                    <Typography variant="h4" className="flow-value">
                      {step.value}
                    </Typography>
                  </RevealNode>
                ))}
              <Box className="flow-arrow" />

              {/* 結果ノード */}
              <RevealNode
                testMode={testMode}
                className="flow-node flow-node--result"
                sx={{
                  borderColor: testMode
                    ? '#90a4ae !important'
                    : `${WEEKDAY_COLORS[result.weekdayIndex]} !important`,
                }}
                masked={
                  <Typography variant="body2" className="flow-label">
                    曜日
                  </Typography>
                }
                onReveal={stopStopwatch}
              >
                <Typography
                  variant="h5"
                  className="flow-value"
                  sx={{ color: WEEKDAY_COLORS[result.weekdayIndex] }}
                >
                  {result.weekday}
                </Typography>
              </RevealNode>
            </Box>

            <Box className="reference-section">
              <Box className="ref-row">
                <CenturyGrid borderColor={NODE_COLORS.century_code} />
                <MonthCodeGrid borderColor={NODE_COLORS.month_code} />
              </Box>
              <WeekdayBar />
              <YearCodeGroupBox
                highlightYear={
                  result
                    ? parseInt(result.input.slice(0, 4), 10) % 100
                    : undefined
                }
                borderColor={NODE_COLORS.year_extract}
              />
            </Box>
          </Box>

          <Box className="year-tables-row">
            <YearCombinedTable
              highlightYear={
                result
                  ? parseInt(result.input.slice(0, 4), 10) % 100
                  : undefined
              }
              borderColor={NODE_COLORS.year_extract}
            />
            <YearCombinedGrid10
              highlightYear={
                result
                  ? parseInt(result.input.slice(0, 4), 10) % 100
                  : undefined
              }
              borderColor={NODE_COLORS.year_extract}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              <a
                href="https://speed-calendar.com/print/"
                target="_blank"
                rel="noopener noreferrer"
              >
                練習用カレンダー印刷 (speed-calendar.com)
              </a>
            </Typography>
          </Box>
        </Box>
      )}
    </Style>
  )
}

type CompactTableProps = {
  title: string
  headers: string[]
  rows: string[][]
  borderColor?: string
}

const _CompactTable = ({
  title,
  headers,
  rows,
  borderColor,
}: CompactTableProps) => (
  <TableContainer
    component={Paper}
    elevation={0}
    sx={{ border: `2px solid ${borderColor ?? '#e0e0e0'}` }}
  >
    <Typography
      variant="caption"
      sx={{ px: 0.5, pt: 0.5, fontWeight: 700, display: 'block' }}
    >
      {title}
    </Typography>
    <Table size="small" className="compact-table">
      <TableHead>
        <TableRow>
          {headers.map((h) => (
            <TableCell key={h}>{h}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={i}>
            {row.map((cell, j) => (
              <TableCell key={j}>{cell}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
)

type YearCodeGridProps = {
  yearCodes: number[]
  highlightYear?: number
  borderColor?: string
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

const WeekdayBar = () => (
  <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', p: 0.5 }}>
    <Box className="weekday-bar">
      {WEEKDAY_LABELS.map((label, i) => (
        <Box
          key={i}
          className="weekday-bar-cell"
          sx={{ color: WEEKDAY_COLORS[i] }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            {i}
          </Typography>
          <Typography variant="caption">{label}</Typography>
        </Box>
      ))}
    </Box>
  </Paper>
)

// (y + floor(y/4)) % 7 の早見表 (1列: y → コード)
const YEAR_COMBINED_MOD7: number[] = Array.from(
  { length: 100 },
  (_, y) => (y + Math.floor(y / 4)) % 7
)

const YearCombinedTable = ({
  highlightYear,
  borderColor,
}: {
  highlightYear?: number
  borderColor: string
}) => (
  <Paper
    elevation={0}
    sx={{
      border: `2px solid ${borderColor}`,
      p: '2px 0',
      width: 'fit-content',
    }}
  >
    <Typography
      variant="caption"
      sx={{ fontWeight: 700, display: 'block', mb: '2px', px: '4px' }}
    >
      年コード (y+⌊y/4⌋)%7 — 28区切り
    </Typography>
    <Box className="year-combined-columns">
      {Array.from({ length: 4 }, (_, col) => (
        <Box key={col} className="year-combined-col">
          {Array.from({ length: 28 }, (_, row) => {
            const y = col * 28 + row
            if (y > 99) return <Box key={y} className="year-combined-cell" />
            const code = YEAR_COMBINED_MOD7[y]
            const isZero = code === 0
            const isSameAsLastDigit = code === y % 10
            const classes = [
              'year-combined-cell',
              y === highlightYear ? 'year-combined-highlight' : '',
              y > 0 && y % 10 === 0
                ? 'year-combined-gap10'
                : y > 0 && y % 4 === 0
                  ? 'year-combined-gap'
                  : '',
              isZero ? 'year-combined-zero' : '',
              isSameAsLastDigit ? 'year-combined-same' : '',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <Box key={y} className={classes}>
                <span className="year-combined-y">
                  {String(y).padStart(2, '0')}
                </span>
                <span className="year-combined-code">{code}</span>
              </Box>
            )
          })}
        </Box>
      ))}
    </Box>
  </Paper>
)

// 年コードを 0-6 でグループ化した一覧
const YEAR_CODE_GROUPS: number[][] = Array.from({ length: 7 }, (_, code) =>
  YEAR_COMBINED_MOD7.reduce<number[]>(
    (acc, v, y) => (v === code ? [...acc, y] : acc),
    []
  )
)

const YearCodeGroupBox = ({
  highlightYear,
  borderColor,
}: {
  highlightYear?: number
  borderColor: string
}) => (
  <Paper
    elevation={0}
    sx={{
      border: `2px solid ${borderColor}`,
      p: '4px 6px',
      width: 'fit-content',
    }}
  >
    <Typography
      variant="caption"
      sx={{ fontWeight: 700, display: 'block', mb: '4px' }}
    >
      年コード — グループ別
    </Typography>
    <Box className="year-code-groups">
      {YEAR_CODE_GROUPS.map((years, code) => (
        <Box key={code} className="year-code-group-row">
          <span className={`year-code-group-label ycg-code-${code}`}>
            {CODE_LABEL(code)}
          </span>
          <span className="year-code-group-sep">:</span>
          <span className="year-code-group-years">
            {years.map((y) => (
              <span
                key={y}
                className={`year-code-group-y${y === highlightYear ? ' year-combined-highlight' : ''}`}
              >
                {String(y).padStart(2, '0')}
              </span>
            ))}
          </span>
        </Box>
      ))}
    </Box>
  </Paper>
)

const YearCombinedGrid10 = ({
  highlightYear,
  borderColor,
}: {
  highlightYear?: number
  borderColor: string
}) => (
  <Paper
    elevation={0}
    sx={{
      border: `2px solid ${borderColor}`,
      p: '2px 0',
      width: 'fit-content',
    }}
  >
    <Typography
      variant="caption"
      sx={{ fontWeight: 700, display: 'block', mb: '2px', px: '4px' }}
    >
      年コード (y+⌊y/4⌋)%7 — 10区切り
    </Typography>
    <Box className="year-combined-grid10">
      {Array.from({ length: 100 }, (_, i) => {
        const col = Math.floor(i / 10)
        const row = i % 10
        const y = row * 10 + col
        const code = YEAR_COMBINED_MOD7[y]
        const isHighlight = y === highlightYear
        const isZero = code === 0
        const isSameAsLastDigit = code === y % 10
        const classes = [
          'year-combined-cell',
          isHighlight ? 'year-combined-highlight' : '',
          isZero ? 'year-combined-zero' : '',
          isSameAsLastDigit ? 'year-combined-same' : '',
          y % 4 === 0 && y % 10 !== 0 ? 'year-grid10-sep' : '',
        ]
          .filter(Boolean)
          .join(' ')
        return (
          <Box key={y} className={classes}>
            <span className="year-combined-y">
              {String(y).padStart(2, '0')}
            </span>
            <span className="year-combined-code">{code}</span>
          </Box>
        )
      })}
    </Box>
  </Paper>
)

// 世紀コード 4x4 グリッド: 列ヘッダ 6,4,2,0 で世紀は左から昇順
const CENTURY_GRID_COLS = [6, 4, 2, 0] as const
// カレンダー式: 左から右へ昇順、行をまたいで続く
const CENTURY_ROWS: (number | null)[][] = [
  [null, null, null, 15],
  [16, 17, 18, 19],
  [20, 21, 22, 23],
  [24, 25, 26, 27],
]

const CenturyGrid = ({ borderColor }: { borderColor: string }) => (
  <Paper elevation={0} sx={{ border: `2px solid ${borderColor}`, p: 0.5 }}>
    <Typography
      variant="caption"
      sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}
    >
      世紀コード (C)
    </Typography>
    <Box className="century-grid">
      {CENTURY_GRID_COLS.map((code) => (
        <Box key={code} className="century-grid-cell century-grid-header">
          {CODE_LABEL(code)}
        </Box>
      ))}
      {CENTURY_ROWS.flat().map((c, i) => (
        <Box key={i} className="century-grid-cell">
          {c !== null ? `${c}xx` : ''}
        </Box>
      ))}
    </Box>
  </Paper>
)

const _YearCodeGrid = ({
  yearCodes,
  highlightYear,
  borderColor,
}: YearCodeGridProps) => (
  <Paper
    elevation={0}
    sx={{ border: `2px solid ${borderColor ?? '#e0e0e0'}`, p: 0.5 }}
  >
    <Typography
      variant="caption"
      sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}
    >
      floor(y/4) mod 7 — y%7 は暗算で足す
    </Typography>
    <Box className="year-grid">
      {/* header row: 0-9 */}
      <Box className="year-grid-cell year-grid-header" />
      {Array.from({ length: 10 }, (_, i) => (
        <Box key={`h${i}`} className="year-grid-cell year-grid-header">
          {i}
        </Box>
      ))}
      {/* data rows: 0x - 9x */}
      {Array.from({ length: 10 }, (_, row) => (
        <>
          <Box key={`r${row}`} className="year-grid-cell year-grid-header">
            {row}x
          </Box>
          {Array.from({ length: 10 }, (_, col) => {
            const y = row * 10 + col
            const isHighlight = y === highlightYear
            return (
              <Box
                key={`${row}-${col}`}
                className={`year-grid-cell ${isHighlight ? 'year-grid-highlight' : ''}`}
              >
                {yearCodes[y]}
              </Box>
            )
          })}
        </>
      ))}
    </Box>
  </Paper>
)

const Style = styled.div`
  .input-section {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .stopwatch {
    padding: 2px 12px;
    border-radius: 8px;
    border: 2px solid #90a4ae;
  }

  .stopwatch--running {
    border-color: #4caf50;
    background: #e8f5e9;
  }

  .stopwatch--stopped {
    border-color: #ff9800;
    background: #fff3e0;
  }

  .sw-history {
    margin-bottom: 16px;
    padding: 8px 12px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fafafa;
  }

  .sw-history-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 4px;
    max-height: 160px;
    overflow-y: auto;
  }

  .sw-history-item {
    display: flex;
    gap: 8px;
    align-items: baseline;
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
    font-family: monospace;
  }

  .sw-history-no {
    color: #9e9e9e;
    width: 28px;
    text-align: right;
  }

  .sw-history-date {
    color: #616161;
    min-width: 100px;
  }

  .sw-history-time {
    font-weight: 700;
  }

  .result-card {
    text-align: center;
    padding: 24px;
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    background: #fff;
  }

  .formula-section {
    background: #f5f5f5;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 24px;
    font-family: monospace;
  }

  .main-content {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 24px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  /* Flowchart */
  .flowchart {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .flow-node {
    border: 2px solid #90a4ae;
    border-radius: 10px;
    padding: 10px 20px;
    text-align: center;
    background: #fff;
    min-width: 120px;

    .flow-label {
      color: #607d8b;
      font-weight: 600;
      font-size: 0.75rem;
    }
    .flow-value {
      font-weight: bold;
      line-height: 1.3;
    }
    .flow-explain {
      color: #78909c;
      display: block;
      margin-top: 2px;
    }
  }

  .flow-node--input {
    border-color: #42a5f5;
    background: #e3f2fd;
    border-radius: 24px;
  }

  .flow-node--calc {
    border-color: #bdbdbd;
    min-width: 0;
    flex: 1;
    padding: 8px 6px;

    .flow-value {
      font-size: 1.4rem;
    }
  }

  .flow-node--sum {
    border-color: #ff9800;
    background: #fff3e0;
  }

  .flow-node--mod {
    border-color: #7c4dff;
    background: #ede7f6;
    border-radius: 50%;
    width: 100px;
    height: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .flow-node--result {
    border-width: 3px;
    border-radius: 24px;
    padding: 12px 32px;
  }

  .flow-arrow {
    width: 2px;
    height: 28px;
    background: #90a4ae;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 8px solid #90a4ae;
    }
  }

  .flow-branch {
    display: flex;
    gap: 8px;
    width: 100%;
    justify-content: center;

    @media (max-width: 768px) {
      flex-wrap: wrap;
    }
  }

  .flow-branch-col {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .flow-branch-year-group {
    flex: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 0;
  }

  .flow-branch-year-pair {
    display: flex;
    gap: 8px;
    width: 100%;
  }

  .flow-year-merge {
    display: flex;
    width: 100%;
    justify-content: center;
    gap: 8px;
    position: relative;
    height: 20px;

    .flow-merge-line {
      flex: 1;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 50%;
        width: 2px;
        height: 10px;
        background: #90a4ae;
      }

      &::before {
        content: '';
        position: absolute;
        top: 10px;
        left: 0;
        right: 0;
        height: 2px;
        background: #90a4ae;
      }
    }
  }

  .flow-node--year-combined {
    background: #e3f2fd;
    padding: 6px 12px;
    min-width: 0;
  }

  .flow-arrow--small {
    height: 16px;
  }

  .flow-node--mod7-pre {
    border: 1.5px dashed #7c4dff;
    border-radius: 6px;
    padding: 2px 8px;
    background: #f3e5f5;
    min-width: 0;

    .flow-label {
      font-size: 0.6rem;
      color: #7c4dff;
    }
    .flow-value {
      font-size: 1rem;
      font-weight: bold;
      color: #7c4dff;
    }
  }

  .flow-spacer {
    height: 42px;
  }

  .flow-merge-arrows {
    display: flex;
    width: 100%;
    justify-content: center;
    gap: 8px;
    position: relative;
    height: 24px;

    .flow-merge-line {
      flex: 1;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 50%;
        width: 2px;
        height: 12px;
        background: #90a4ae;
      }

      &::before {
        content: '';
        position: absolute;
        top: 12px;
        left: 0;
        right: 0;
        height: 2px;
        background: #90a4ae;
      }
    }
  }

  .reference-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ref-row {
    display: flex;
    gap: 8px;
  }

  .compact-table {
    .MuiTableCell-root {
      padding: 1px 6px;
      font-size: 0.75rem;
      line-height: 1.4;
      border-bottom: 1px solid #f0f0f0;
    }
    .MuiTableCell-head {
      font-weight: 600;
      font-size: 0.7rem;
      color: #757575;
      padding: 2px 6px;
    }
  }

  .weekday-bar {
    display: flex;
    gap: 2px;
  }

  .weekday-bar-cell {
    flex: 1;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.3;
  }

  .node--masked {
    cursor: pointer;
    background: #eeeeee !important;
    border-color: #bdbdbd !important;
    user-select: none;

    &:hover {
      background: #e0e0e0 !important;
    }
  }

  .year-tables-row {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    flex-wrap: wrap;
    margin-top: 24px;
  }

  .year-combined-columns {
    display: flex;
    gap: 12px;
  }

  .year-combined-col {
    font-size: 0.8rem;
    width: 48px;
  }

  .year-combined-col .year-combined-cell {
    border-top: 1px solid transparent;
  }

  .year-combined-cell {
    display: flex;
    justify-content: space-between;
    padding: 0 4px;
    line-height: 1.3;
    font-variant-numeric: tabular-nums;

    .year-combined-y {
      color: #9e9e9e;
      margin-right: 4px;
    }
    .year-combined-code {
      font-weight: 700;
    }
  }

  .year-combined-gap {
    border-top-color: #e0e0e0 !important;
  }

  .year-combined-gap10 {
    border-top-color: #ccc !important;
  }

  .year-combined-zero {
    .year-combined-code {
      color: #e53935;
    }
  }

  .year-combined-same {
    .year-combined-y {
      color: #2196f3;
      font-weight: 600;
    }
  }

  .year-combined-highlight {
    background: #bbdefb;
    border-radius: 2px;
  }

  .year-combined-grid10 {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 0 4px;
    font-size: 0.8rem;
    padding: 0 4px;

    .year-combined-cell {
      border-top: 1px solid transparent;
    }
  }

  .year-grid10-sep {
    border-top-color: #ccc !important;
  }

  .year-code-groups {
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .year-code-group-row {
    display: flex;
    align-items: baseline;
    gap: 4px;
    line-height: 1.5;
    padding: 1px 4px;
    border-radius: 4px;
    &:hover {
      background: rgba(0, 0, 0, 0.03);
    }
  }

  .year-code-group-label {
    font-weight: 700;
    min-width: 28px;
    text-align: right;
    flex-shrink: 0;
    font-size: 0.8rem;
    padding: 0 2px;
    border-radius: 3px;
  }

  .ycg-code-0 { color: #2e7d32; background: #e8f5e9; }
  .ycg-code-1 { color: #1565c0; background: #e3f2fd; }
  .ycg-code-2 { color: #6a1b9a; background: #f3e5f5; }
  .ycg-code-3 { color: #e65100; background: #fff3e0; }
  .ycg-code-4 { color: #c62828; background: #ffebee; }
  .ycg-code-5 { color: #00838f; background: #e0f7fa; }
  .ycg-code-6 { color: #4e342e; background: #efebe9; }

  .year-code-group-sep {
    color: #bdbdbd;
    flex-shrink: 0;
  }

  .year-code-group-years {
    display: flex;
    flex-wrap: wrap;
    gap: 0 6px;
  }

  .year-code-group-y {
    color: #616161;
  }

  .mcode-grid {
    display: grid;
    grid-template-columns: auto repeat(7, 1fr);
    gap: 1px;
    font-size: 0.7rem;
    text-align: center;
  }

  .mcode-cell {
    padding: 1px 3px;
    line-height: 1.5;
  }

  .mcode-header {
    font-weight: 700;
    color: #757575;
    border-bottom: 1px solid #e0e0e0;
  }

  .mcode-month {
    font-weight: 600;
    text-align: right;
    color: #616161;
    font-size: 0.65rem;
  }

  .mcode-active {
    font-weight: 700;
    border-radius: 3px;
  }

  .mcode-g-zero { background: #e3f2fd; color: #1565c0; }
  .mcode-g-swap { background: #fce4ec; color: #c62828; }
  .mcode-g-three { background: #e8f5e9; color: #2e7d32; }
  .mcode-g-chain { background: #fff3e0; color: #e65100; }
  .mcode-g-solo3 { background: #f3e5f5; color: #6a1b9a; }
  .mcode-g-memorize { background: #eceff1; color: #37474f; }

  .mcode-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 6px;
    margin-top: 4px;
    font-size: 0.55rem;
  }

  .mcode-leg {
    padding: 0 3px;
    border-radius: 2px;
    font-weight: 600;
  }

  .century-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    font-size: 0.75rem;
    text-align: center;
  }

  .century-grid-cell {
    padding: 2px 4px;
    line-height: 1.4;
  }

  .century-grid-header {
    font-weight: 700;
    color: #4caf50;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 4px;
    margin-bottom: 2px;
  }

  .year-grid {
    display: grid;
    grid-template-columns: repeat(11, 1fr);
    gap: 1px;
    font-size: 0.7rem;
  }

  .year-grid-cell {
    text-align: center;
    padding: 2px 0;
    line-height: 1.4;
    font-variant-numeric: tabular-nums;
  }

  .year-grid-header {
    font-weight: 700;
    color: #757575;
    font-size: 0.65rem;
  }

  .year-grid-highlight {
    background: #bbdefb;
    border-radius: 3px;
    font-weight: 700;
  }
`

export default WeekdayCalcExplainer
