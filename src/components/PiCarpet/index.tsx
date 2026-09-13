import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import styled, { keyframes } from 'styled-components'
import {
  type Carpet,
  PI_DIGITS,
  buildCarpet,
  formatTime,
  neighborCols,
} from './pi'

type Status = 'ready' | 'playing' | 'clear'

const GOALS = [10, 20, 50, 100]
const WIDTHS = [5, 7, 9]
// ミスは止めずに加算で払わせる。手が止まる方式だと「速く登る」以外の
// 駆け引きが増えてタイムの意味が濁る
const MISS_PENALTY_MS = 1000
const ROWS_AHEAD = 7
const ROWS_BEHIND = 2
const GAP = 4
const MIN_CELL = 30
const MAX_CELL = 56
const TIMER_INTERVAL_MS = 31

const bestKey = (goal: number, cols: number) => `pi-carpet-best-${goal}-${cols}`

const loadBest = (goal: number, cols: number) => {
  try {
    const raw = window.localStorage.getItem(bestKey(goal, cols))
    return raw === null ? null : Number(raw)
  } catch {
    // Safari のプライベートモード等で localStorage が投げる。
    // 記録が残らないだけでゲームは成立するので握りつぶす
    return null
  }
}

const saveBest = (goal: number, cols: number, ms: number) => {
  try {
    window.localStorage.setItem(bestKey(goal, cols), String(ms))
  } catch {
    // 同上
  }
}

const useCellSize = (cols: number) => {
  const ref = useRef<HTMLDivElement>(null)
  const [cell, setCell] = useState(MAX_CELL)

  useEffect(() => {
    const el = ref.current
    if (el === null) return

    const applyCellSize = () => {
      const width = el.clientWidth
      const raw = Math.floor((width - GAP * (cols - 1)) / cols)
      setCell(Math.max(MIN_CELL, Math.min(MAX_CELL, raw)))
    }

    applyCellSize()
    const observer = new ResizeObserver(applyCellSize)
    observer.observe(el)
    return () => observer.disconnect()
  }, [cols])

  return { ref, cell }
}

const PiCarpet = () => {
  const [goal, setGoal] = useState(20)
  const [cols, setCols] = useState(7)
  const [hint, setHint] = useState(false)
  const [carpet, setCarpet] = useState<Carpet>(() => buildCarpet(20, 7))
  const [step, setStep] = useState(0)
  const [misses, setMisses] = useState(0)
  const [status, setStatus] = useState<Status>('ready')
  const [startedAt, setStartedAt] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [finishedMs, setFinishedMs] = useState(0)
  const [wrongCol, setWrongCol] = useState<number | null>(null)
  const [best, setBest] = useState<number | null>(null)

  const { ref: boardRef, cell } = useCellSize(cols)
  const pitch = cell + GAP

  useEffect(() => {
    setBest(loadBest(goal, cols))
  }, [goal, cols])

  useEffect(() => {
    if (status !== 'playing') return
    const id = window.setInterval(() => {
      setElapsed(Date.now() - startedAt)
    }, TIMER_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [status, startedAt])

  const reset = useCallback((nextGoal: number, nextCols: number) => {
    setCarpet(buildCarpet(nextGoal, nextCols))
    setStep(0)
    setMisses(0)
    setStatus('ready')
    setElapsed(0)
    setFinishedMs(0)
    setWrongCol(null)
  }, [])

  const candidates = useMemo(
    () => neighborCols(carpet.path[step], cols),
    [carpet, step, cols]
  )

  const tryStep = useCallback(
    (col: number) => {
      if (status === 'clear' || step >= goal) return
      if (!candidates.includes(col)) return

      const startMs = status === 'ready' ? Date.now() : startedAt
      if (status === 'ready') {
        setStartedAt(startMs)
        setStatus('playing')
      }

      if (col !== carpet.path[step + 1]) {
        setMisses((prev) => prev + 1)
        setWrongCol(col)
        window.setTimeout(() => setWrongCol(null), 220)
        return
      }

      const nextStep = step + 1
      setStep(nextStep)
      setWrongCol(null)
      if (nextStep < goal) return

      const total = Date.now() - startMs + misses * MISS_PENALTY_MS
      setFinishedMs(total)
      setElapsed(Date.now() - startMs)
      setStatus('clear')
      if (best === null || total < best) {
        saveBest(goal, cols, total)
        setBest(total)
      }
    },
    [status, step, goal, candidates, carpet, startedAt, misses, best, cols]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const from = carpet.path[step]
      const delta =
        e.key === 'ArrowLeft'
          ? -1
          : e.key === 'ArrowRight'
            ? 1
            : e.key === 'ArrowUp'
              ? 0
              : null
      if (delta === null) return
      e.preventDefault()
      tryStep(from + delta)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [carpet, step, tryStep])

  const runningMs =
    status === 'clear' ? finishedMs : elapsed + misses * MISS_PENALTY_MS
  const answerCol = step < goal ? carpet.path[step + 1] : null
  const offset = (ROWS_AHEAD - goal + step) * pitch
  const viewportHeight = (ROWS_AHEAD + ROWS_BEHIND + 1) * pitch

  return (
    <Stack spacing={2}>
      <Hud elevation={0}>
        <div>
          <Label>TIME</Label>
          <Time>{formatTime(runningMs)}</Time>
        </div>
        <div>
          <Label>DIGITS</Label>
          <Value>
            {step}
            <Sub> / {goal}</Sub>
          </Value>
        </div>
        <div>
          <Label>MISS</Label>
          <Value $warn={misses > 0}>
            {misses}
            <Sub> (+{formatTime(misses * MISS_PENALTY_MS)})</Sub>
          </Value>
        </div>
        <div>
          <Label>BEST</Label>
          <Value>{best === null ? '--.--' : formatTime(best)}</Value>
        </div>
      </Hud>

      <Trail>
        <span>3.</span>
        {PI_DIGITS.slice(1, step + 1)
          .split('')
          .map((digit, i) => (
            // 円周率の桁は位置が意味を持つので index を key にしてよい
            <span key={i}>{digit}</span>
          ))}
        <Cursor>
          {hint && answerCol !== null ? PI_DIGITS[step + 1] : '_'}
        </Cursor>
      </Trail>

      <Stage>
        <Viewport style={{ height: viewportHeight }}>
          <Field
            ref={boardRef}
            style={{
              height: (goal + 1) * pitch,
              transform: `translateY(${offset}px)`,
            }}
          >
            {carpet.rows
              .map((row, index) => ({ row, index }))
              .reverse()
              .map(({ row, index }) => (
                <Row
                  key={index}
                  style={{
                    top: (goal - index) * pitch,
                    height: cell,
                    gap: GAP,
                  }}
                >
                  {row.map((digit, col) => {
                    const isPassed = index <= step && carpet.path[index] === col
                    const isCurrent =
                      index === step && carpet.path[index] === col
                    const isCandidate =
                      index === step + 1 && candidates.includes(col)
                    return (
                      <Cell
                        key={col}
                        type="button"
                        onClick={() => index === step + 1 && tryStep(col)}
                        style={{
                          width: cell,
                          height: cell,
                          fontSize: cell * 0.5,
                        }}
                        $passed={isPassed}
                        $current={isCurrent}
                        $candidate={isCandidate}
                        $hinted={hint && isCandidate && col === answerCol}
                        $wrong={index === step + 1 && col === wrongCol}
                      >
                        {digit}
                      </Cell>
                    )
                  })}
                </Row>
              ))}
          </Field>
          <Fade />
        </Viewport>
      </Stage>

      <Stack
        direction="row"
        spacing={1}
        justifyContent="center"
        flexWrap="wrap"
        useFlexGap
      >
        <ArrowButton onClick={() => tryStep(carpet.path[step] - 1)}>
          ↖
        </ArrowButton>
        <ArrowButton onClick={() => tryStep(carpet.path[step])}>↑</ArrowButton>
        <ArrowButton onClick={() => tryStep(carpet.path[step] + 1)}>
          ↗
        </ArrowButton>
      </Stack>

      {status === 'clear' && (
        <Result elevation={3}>
          <Typography variant="h5">GOAL {goal} 桁</Typography>
          <Time>{formatTime(finishedMs)}</Time>
          <Typography variant="body2" color="text.secondary">
            走行 {formatTime(elapsed)} + ミス {misses} 回 ×{' '}
            {formatTime(MISS_PENALTY_MS)}
            {best !== null && finishedMs <= best ? ' — ベスト更新!' : ''}
          </Typography>
          <Button onClick={() => reset(goal, cols)} sx={{ mt: 1 }}>
            もう一度
          </Button>
        </Result>
      )}

      <Stack
        direction="row"
        spacing={2}
        flexWrap="wrap"
        useFlexGap
        alignItems="center"
      >
        <TextField
          select
          size="small"
          label="ゴール"
          value={goal}
          onChange={(e) => {
            const next = Number(e.target.value)
            setGoal(next)
            reset(next, cols)
          }}
          sx={{ width: 110 }}
        >
          {GOALS.map((value) => (
            <MenuItem key={value} value={value}>
              {value} 桁
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="幅"
          value={cols}
          onChange={(e) => {
            const next = Number(e.target.value)
            setCols(next)
            reset(goal, next)
          }}
          sx={{ width: 100 }}
        >
          {WIDTHS.map((value) => (
            <MenuItem key={value} value={value}>
              {value} 列
            </MenuItem>
          ))}
        </TextField>
        <FormControlLabel
          control={
            <Switch
              checked={hint}
              onChange={(e) => setHint(e.target.checked)}
            />
          }
          label="ヒント (練習)"
        />
        <Button variant="outlined" onClick={() => reset(goal, cols)}>
          リセット
        </Button>
      </Stack>

      <Box>
        <Typography variant="body2" color="text.secondary">
          上に伸びる数字の絨毯を、円周率 3.14159…
          の順に一桁ずつ踏んで登る。進めるのは真上と斜め上の 3
          マスで、次の桁と一致するのは必ずそのうち 1 マスだけ。← ↑ →
          キーかタップで選ぶ。計測は最初の 一歩から始まり、ミス 1 回につき{' '}
          {formatTime(MISS_PENALTY_MS)} 秒が加算される。
        </Typography>
      </Box>
    </Stack>
  )
}

const Hud = styled(Paper)`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  align-items: baseline;
  background: #1a1512;
  color: #f5f5f5;
  padding: 0.6rem 0.9rem;
  border-radius: 8px;
`

const Label = styled.div`
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  color: #9e9e9e;
`

const Time = styled.div`
  font-family: monospace;
  font-size: 2rem;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
`

const Value = styled.div<{ $warn?: boolean }>`
  font-family: monospace;
  font-size: 1.4rem;
  line-height: 1.4;
  color: ${({ $warn }) => ($warn ? '#ef9a9a' : 'inherit')};
`

const Sub = styled.span`
  font-size: 0.8rem;
  color: #9e9e9e;
`

const Trail = styled.div`
  font-family: monospace;
  font-size: 1rem;
  word-break: break-all;
  color: #795548;
  min-height: 1.4em;
`

const Cursor = styled.span`
  background: #d4a017;
  color: #1a1512;
  padding: 0 0.15em;
`

const Stage = styled.div`
  perspective: 900px;
`

const Viewport = styled.div`
  position: relative;
  overflow: hidden;
  transform: rotateX(28deg);
  transform-origin: bottom center;
`

const Field = styled.div`
  position: relative;
  transition: transform 0.16s ease-out;
`

const Row = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
`

const Fade = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    rgba(250, 250, 250, 0.95) 0%,
    rgba(250, 250, 250, 0) 45%
  );
`

const wrongFlash = keyframes`
  from { transform: translateX(-3px); }
  to { transform: translateX(3px); }
`

type CellProps = {
  $passed: boolean
  $current: boolean
  $candidate: boolean
  $hinted: boolean
  $wrong: boolean
}

const cellBg = ({ $passed, $current, $candidate, $wrong }: CellProps) => {
  if ($wrong) return '#e57373'
  if ($current) return '#d4a017'
  if ($passed) return '#d7ccc8'
  if ($candidate) return '#fff'
  return '#f5f5f5'
}

const Cell = styled.button<CellProps>`
  border: 2px solid
    ${({ $candidate, $hinted }) =>
      $hinted ? '#43a047' : $candidate ? '#795548' : 'transparent'};
  border-radius: 6px;
  background: ${cellBg};
  color: ${({ $current, $wrong }) => ($current || $wrong ? '#1a1512' : '#5d4037')};
  font-family: monospace;
  font-weight: 700;
  padding: 0;
  cursor: ${({ $candidate }) => ($candidate ? 'pointer' : 'default')};
  opacity: ${({ $passed, $candidate, $current }) =>
    $passed || $candidate || $current ? 1 : 0.75};
  animation: ${({ $wrong }) => ($wrong ? wrongFlash : 'none')} 0.06s 3 alternate;
`

const ArrowButton = styled.button`
  width: 64px;
  height: 44px;
  font-size: 1.2rem;
  border-radius: 8px;
  border: 1px solid #d7ccc8;
  background: #fff;
  color: #5d4037;
  cursor: pointer;
`

const Result = styled(Paper)`
  padding: 1rem;
  text-align: center;
  background: #fff8e1;
`

export default PiCarpet
