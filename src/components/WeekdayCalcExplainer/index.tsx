import { useState } from 'react'
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
} from '@mui/material'
import styled from 'styled-components'
import {
  calculateWeekday,
  MONTH_CODES,
  CENTURY_CODES,
  WEEKDAY_NAMES,
  WEEKDAY_NAMES_JA,
  type WeekdayResult,
} from './weekdayCalc'

// floor(y/4) mod 7 の早見表 (y%7 は暗算で足す)
const YEAR_DIV4_MOD7: number[] = Array.from({ length: 100 }, (_, y) =>
  Math.floor(y / 4) % 7
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

const WeekdayCalcExplainer = () => {
  const [dateInput, setDateInput] = useState(todayStr())
  const [result, setResult] = useState<WeekdayResult | null>(() =>
    calculateWeekday(todayStr())
  )
  const [error, setError] = useState('')

  const handleCalc = () => {
    const r = calculateWeekday(dateInput)
    if (r === null) {
      setError('無効な日付です (対応範囲: 1500-01-01 ~ 2599-12-31)')
      setResult(null)
      return
    }
    setError('')
    setResult(r)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCalc()
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
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {result && (
        <>
          <Paper className="result-card" elevation={2}>
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
            {result.isLeapYear && (
              <Chip label="閏年" color="info" size="small" />
            )}
          </Paper>

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

              {/* 分岐: D, y, floor(y/4), m, C を並列表示 */}
              <Box className="flow-branch">
                {result.steps.slice(0, 5).map((step) => {
                  const mod7Val = ((step.value % 7) + 7) % 7
                  const needsMod = step.value >= 7
                  return (
                    <Box key={step.name} className="flow-branch-col">
                      <Box
                        className="flow-node flow-node--calc"
                        sx={{ borderColor: `${NODE_COLORS[step.name]} !important` }}
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
                      </Box>
                      {needsMod ? (
                        <>
                          <Box className="flow-arrow flow-arrow--small" />
                          <Box className="flow-node flow-node--mod7-pre">
                            <Typography variant="caption" className="flow-label">
                              %7
                            </Typography>
                            <Typography variant="body1" className="flow-value">
                              {mod7Val}
                            </Typography>
                          </Box>
                        </>
                      ) : (
                        <Box className="flow-spacer" />
                      )}
                    </Box>
                  )
                })}
              </Box>

              {/* 合流矢印 */}
              <Box className="flow-merge-arrows">
                {result.steps.slice(0, 5).map((step) => (
                  <Box key={step.name} className="flow-merge-line" />
                ))}
              </Box>
              <Box className="flow-arrow" />

              {/* 合計ノード */}
              {result.steps
                .filter((s) => s.name === 'sum')
                .map((step) => (
                  <Box key={step.name} className="flow-node flow-node--sum">
                    <Typography variant="body2" className="flow-label">
                      {step.label}
                    </Typography>
                    <Typography variant="h4" className="flow-value">
                      {step.value}
                    </Typography>
                    <Typography variant="caption" className="flow-explain">
                      {step.explain}
                    </Typography>
                  </Box>
                ))}
              <Box className="flow-arrow" />

              {/* mod7 ノード */}
              {result.steps
                .filter((s) => s.name === 'mod7')
                .map((step) => (
                  <Box key={step.name} className="flow-node flow-node--mod">
                    <Typography variant="body2" className="flow-label">
                      {step.label}
                    </Typography>
                    <Typography variant="h4" className="flow-value">
                      {step.value}
                    </Typography>
                    <Typography variant="caption" className="flow-explain">
                      {step.explain}
                    </Typography>
                  </Box>
                ))}
              <Box className="flow-arrow" />

              {/* 結果ノード */}
              <Box
                className="flow-node flow-node--result"
                sx={{
                  borderColor: `${WEEKDAY_COLORS[result.weekdayIndex]} !important`,
                }}
              >
                <Typography
                  variant="h5"
                  className="flow-value"
                  sx={{ color: WEEKDAY_COLORS[result.weekdayIndex] }}
                >
                  {result.weekday}
                </Typography>
              </Box>
            </Box>

            <Box className="reference-section">
              <Box className="ref-row">
                <CenturyGrid borderColor={NODE_COLORS.century_code} />
                <CompactTable
                  title="月コード (m)"
                  headers={['月', 'コード']}
                  rows={Object.entries(MONTH_CODES).map(([m, c]) => [
                    `${m}`,
                    String(c),
                  ])}
                  borderColor={NODE_COLORS.month_code}
                />
              </Box>
              <WeekdayBar />
              <YearCodeGrid
                yearCodes={YEAR_DIV4_MOD7}
                highlightYear={result ? parseInt(result.input.slice(0, 4)) % 100 : undefined}
                borderColor={NODE_COLORS.year_extract}
              />
            </Box>
          </Box>
        </>
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

const CompactTable = ({ title, headers, rows, borderColor }: CompactTableProps) => (
  <TableContainer
    component={Paper}
    elevation={0}
    sx={{ border: `2px solid ${borderColor ?? '#e0e0e0'}` }}
  >
    <Typography variant="caption" sx={{ px: 0.5, pt: 0.5, fontWeight: 700, display: 'block' }}>
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
        <Box key={i} className="weekday-bar-cell" sx={{ color: WEEKDAY_COLORS[i] }}>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            {i}
          </Typography>
          <Typography variant="caption">{label}</Typography>
        </Box>
      ))}
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
    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
      世紀コード (C)
    </Typography>
    <Box className="century-grid">
      {CENTURY_GRID_COLS.map((code) => (
        <Box key={code} className="century-grid-cell century-grid-header">
          {code}
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

const YearCodeGrid = ({ yearCodes, highlightYear, borderColor }: YearCodeGridProps) => (
  <Paper elevation={0} sx={{ border: `2px solid ${borderColor ?? '#e0e0e0'}`, p: 0.5 }}>
    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
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
  }

  .result-card {
    text-align: center;
    padding: 24px;
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
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
