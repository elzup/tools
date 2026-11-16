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
  type Pos,
  buildCarpet,
  formatTime,
  isSamePos,
  neighborPositions,
} from './pi'

type Status = 'ready' | 'playing' | 'clear'

const GOALS = [10, 20, 50, 100]
// ミスは止めずに加算で払わせる。手が止まる方式だと「速く辿る」以外の
// 駆け引きが増えてタイムの意味が濁る
const MISS_PENALTY_MS = 1000
const GAP = 4
const MIN_CELL = 24
const MAX_CELL = 52
const TIMER_INTERVAL_MS = 31

const bestKey = (goal: number) => `pi-carpet-best-${goal}`

const loadBest = (goal: number) => {
  try {
    const raw = window.localStorage.getItem(bestKey(goal))
    return raw === null ? null : Number(raw)
  } catch {
    // Safari のプライベートモード等で localStorage が投げる。
    // 記録が残らないだけでゲームは成立するので握りつぶす
    return null
  }
}

const saveBest = (goal: number, ms: number) => {
  try {
    window.localStorage.setItem(bestKey(goal), String(ms))
  } catch {
    // 同上
  }
}

const useCellSize = (size: number) => {
  const ref = useRef<HTMLDivElement>(null)
  const [cell, setCell] = useState(MAX_CELL)

  useEffect(() => {
    const el = ref.current
    if (el === null) return

    const applyCellSize = () => {
      const width = el.clientWidth
      const raw = Math.floor((width - GAP * (size - 1)) / size)
      setCell(Math.max(MIN_CELL, Math.min(MAX_CELL, raw)))
    }

    applyCellSize()
    const observer = new ResizeObserver(applyCellSize)
    observer.observe(el)
    return () => observer.disconnect()
  }, [size])

  return { ref, cell }
}

const deltaFromKey = (key: string): Pos | null => {
  if (key === 'ArrowUp' || key === 'w' || key === 'k')
    return { row: -1, col: 0 }
  if (key === 'ArrowDown' || key === 's' || key === 'j')
    return { row: 1, col: 0 }
  if (key === 'ArrowLeft' || key === 'a' || key === 'h')
    return { row: 0, col: -1 }
  if (key === 'ArrowRight' || key === 'd' || key === 'l')
    return { row: 0, col: 1 }
  return null
}

const PiCarpet = () => {
  const [goal, setGoal] = useState(20)
  const [hint, setHint] = useState(false)
  const [carpet, setCarpet] = useState<Carpet>(() => buildCarpet(20))
  const [step, setStep] = useState(0)
  const [misses, setMisses] = useState(0)
  const [status, setStatus] = useState<Status>('ready')
  const [startedAt, setStartedAt] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [finishedMs, setFinishedMs] = useState(0)
  const [wrongPos, setWrongPos] = useState<Pos | null>(null)
  const [best, setBest] = useState<number | null>(null)

  const { ref: boardRef, cell } = useCellSize(carpet.size)

  useEffect(() => {
    setBest(loadBest(goal))
  }, [goal])

  useEffect(() => {
    if (status !== 'playing') return
    const id = window.setInterval(() => {
      setElapsed(Date.now() - startedAt)
    }, TIMER_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [status, startedAt])

  const reset = useCallback((nextGoal: number) => {
    setCarpet(buildCarpet(nextGoal))
    setStep(0)
    setMisses(0)
    setStatus('ready')
    setElapsed(0)
    setFinishedMs(0)
    setWrongPos(null)
  }, [])

  const passedSteps = useMemo(
    () => carpet.path.slice(0, step + 1),
    [carpet.path, step]
  )

  const candidates = useMemo(() => {
    if (step >= goal) return []
    const current = carpet.path[step]
    return neighborPositions(current, carpet.size).filter(
      (nb) => !passedSteps.some((p) => isSamePos(p, nb))
    )
  }, [carpet, step, goal, passedSteps])

  const tryStep = useCallback(
    (target: Pos) => {
      if (status === 'clear' || step >= goal) return
      if (!candidates.some((c) => isSamePos(c, target))) return

      const startMs = status === 'ready' ? Date.now() : startedAt
      if (status === 'ready') {
        setStartedAt(startMs)
        setStatus('playing')
      }

      const answer = carpet.path[step + 1]
      if (!isSamePos(target, answer)) {
        setMisses((prev) => prev + 1)
        setWrongPos(target)
        window.setTimeout(() => setWrongPos(null), 220)
        return
      }

      const nextStep = step + 1
      setStep(nextStep)
      setWrongPos(null)
      if (nextStep < goal) return

      const total = Date.now() - startMs + misses * MISS_PENALTY_MS
      setFinishedMs(total)
      setElapsed(Date.now() - startMs)
      setStatus('clear')
      if (best === null || total < best) {
        saveBest(goal, total)
        setBest(total)
      }
    },
    [status, step, goal, candidates, carpet, startedAt, misses, best]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const delta = deltaFromKey(e.key)
      if (delta === null) return
      e.preventDefault()
      const current = carpet.path[step]
      tryStep({ row: current.row + delta.row, col: current.col + delta.col })
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [carpet, step, tryStep])

  const runningMs =
    status === 'clear' ? finishedMs : elapsed + misses * MISS_PENALTY_MS
  const currentPos = carpet.path[step]
  const answerPos = step < goal ? carpet.path[step + 1] : null

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
          <Label>GRID</Label>
          <Value>
            {carpet.size}×{carpet.size}
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
          {hint && answerPos !== null ? PI_DIGITS[step + 1] : '_'}
        </Cursor>
      </Trail>

      <Board ref={boardRef}>
        <Grid style={{ gap: GAP }}>
          {carpet.rows.map((row, rowIndex) => (
            <Row key={rowIndex} style={{ gap: GAP }}>
              {row.map((digit, colIndex) => {
                const pos = { row: rowIndex, col: colIndex }
                const isPassed = passedSteps.some((p) => isSamePos(p, pos))
                const isCurrent = isSamePos(currentPos, pos)
                const isCandidate = candidates.some((c) => isSamePos(c, pos))
                const isHinted =
                  hint &&
                  answerPos !== null &&
                  isCandidate &&
                  isSamePos(answerPos, pos)
                const isWrong = wrongPos !== null && isSamePos(wrongPos, pos)

                return (
                  <Cell
                    key={colIndex}
                    type="button"
                    onClick={() => isCandidate && tryStep(pos)}
                    style={{
                      width: cell,
                      height: cell,
                      fontSize: Math.max(13, Math.round(cell * 0.48)),
                    }}
                    $passed={isPassed}
                    $current={isCurrent}
                    $candidate={isCandidate}
                    $hinted={isHinted}
                    $wrong={isWrong}
                  >
                    {digit}
                  </Cell>
                )
              })}
            </Row>
          ))}
        </Grid>
      </Board>

      <Stack
        direction="row"
        spacing={1}
        justifyContent="center"
        flexWrap="wrap"
        useFlexGap
      >
        <ArrowButton
          onClick={() =>
            tryStep({ row: currentPos.row, col: currentPos.col - 1 })
          }
        >
          ←
        </ArrowButton>
        <ArrowButton
          onClick={() =>
            tryStep({ row: currentPos.row - 1, col: currentPos.col })
          }
        >
          ↑
        </ArrowButton>
        <ArrowButton
          onClick={() =>
            tryStep({ row: currentPos.row + 1, col: currentPos.col })
          }
        >
          ↓
        </ArrowButton>
        <ArrowButton
          onClick={() =>
            tryStep({ row: currentPos.row, col: currentPos.col + 1 })
          }
        >
          →
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
          <Button onClick={() => reset(goal)} sx={{ mt: 1 }}>
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
            reset(next)
          }}
          sx={{ width: 110 }}
        >
          {GOALS.map((value) => (
            <MenuItem key={value} value={value}>
              {value} 桁
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
        <Button variant="outlined" onClick={() => reset(goal)}>
          リセット
        </Button>
      </Stack>

      <Box>
        <Typography variant="body2" color="text.secondary">
          2 次元に敷き詰められた数字の絨毯を俯瞰し、中央の 3 から円周率 3.14159…
          の順に上下左右へ一筆書きで辿る。進めるのは現在地の上下左右のうち未踏のマスで、次の桁と一致するのは必ずそのうち
          1 マスだけ。矢印キー (または WASD / タップ)
          で選ぶ。計測は最初の一歩から始まり、ミス 1 回につき{' '}
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

const Board = styled.div`
  display: flex;
  justify-content: center;
  padding: 0.75rem;
  background: #efebe9;
  border-radius: 10px;
`

const Grid = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const Row = styled.div`
  display: flex;
  justify-content: center;
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
  if ($passed) return '#bcaaa4'
  if ($candidate) return '#fff'
  return '#f5f5f5'
}

const Cell = styled.button<CellProps>`
  border: 2px solid
    ${({ $candidate, $hinted }) =>
      $hinted ? '#43a047' : $candidate ? '#795548' : 'transparent'};
  border-radius: 6px;
  background: ${cellBg};
  color: ${({ $current, $wrong }) =>
    $current || $wrong ? '#1a1512' : '#5d4037'};
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
