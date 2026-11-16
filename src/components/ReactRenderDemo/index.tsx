import { Alert, Button, Paper, Stack, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Child, CodeLine, CodeView, MemoChild } from './parts'
import {
  bump,
  createBoard,
  paintAllStatus,
  ProbeBoard,
  ProbeBoardContext,
  useProbeBoard,
  useRenderProbe,
} from './probeBoard'

const probe = (key: string, kind: string) => ({ key, kind })

// 下の App 実装と 1 行ずつ対応させている。片方を変えたらもう片方も直すこと
const LINES: CodeLine[] = [
  {
    code: 'const Child = ({ id, onClick }) => <button onClick={onClick}>ID {id}</button>',
  },
  { code: 'const MemoChild = memo(Child)' },
  { code: '' },
  { code: 'function App() {', probe: probe('app', '描画') },
  { code: '  const [id, setId] = useState(1)' },
  { code: '  const [count, setCount] = useState(0)' },
  { code: '' },
  { code: '  const plain = id * 10', probe: probe('calcPlain', '計算') },
  {
    code: '  const memoized = useMemo(() => id * 10, [id])',
    probe: probe('calcMemo', '計算'),
  },
  {
    code: '  const inc = useCallback(() => setId(id + 1), [id])',
    probe: probe('callback', '関数生成'),
  },
  { code: '' },
  {
    code: '  useEffect(() => { /* 毎回 */ })',
    probe: probe('effectEvery', '実行'),
  },
  {
    code: '  useEffect(() => { /* id が変わった時 */ }, [id])',
    probe: probe('effectId', '実行'),
  },
  { code: '' },
  { code: '  return (' },
  { code: '    <>' },
  { code: '      <p>count: {count} / {plain} / {memoized}</p>' },
  { code: '      <Child id={id} />', probe: probe('child', '描画') },
  { code: '      <MemoChild id={id} />', probe: probe('memo', '描画') },
  {
    code: '      <MemoChild id={id} onClick={() => setId(id + 1)} />  // 毎回新しい関数',
    probe: probe('memoInlineFn', '描画'),
  },
  {
    code: '      <MemoChild id={id} onClick={inc} />  // 同じ関数を使い回す',
    probe: probe('memoCallback', '描画'),
  },
  { code: '    </>' },
  { code: '  )' },
  { code: '}' },
]

const App = ({ onReset }: { onReset: () => void }) => {
  const board = useProbeBoard()
  const [id, setIdRaw] = useState(1)
  const [count, setCountRaw] = useState(0)

  // 「どの操作で動いたか」を判定するため、state 更新の直前に操作番号を進める
  const setId = (next: number) => {
    board.seq += 1
    setIdRaw(next)
  }
  const setCount = (next: number) => {
    board.seq += 1
    setCountRaw(next)
  }

  useRenderProbe('app')

  // 計算・関数生成が走った回数を数えるため、意図的に render 中で bump している
  bump(board, 'calcPlain')
  const plain = id * 10
  const memoized = useMemo(() => {
    bump(board, 'calcMemo')
    return id * 10
  }, [board, id])
  const inc = useCallback(() => {
    board.seq += 1
    setIdRaw(id + 1)
  }, [board, id])
  const prevInc = useRef<typeof inc | null>(null)
  if (prevInc.current !== inc) {
    bump(board, 'callback')
    prevInc.current = inc
  }

  useEffect(() => {
    bump(board, 'effectEvery')
  })
  useEffect(() => {
    bump(board, 'effectId')
  }, [board, id])
  // 子と自分の effect がすべて終わった後に判定したいので、必ず最後の effect に置く
  useEffect(() => {
    paintAllStatus(board)
  })

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button variant="contained" onClick={() => setCount(count + 1)}>
          setCount(count + 1)
        </Button>
        <Button variant="outlined" onClick={() => setId(id + 1)}>
          setId(id + 1)
        </Button>
        <Button color="inherit" onClick={onReset}>
          リセット
        </Button>
      </Stack>

      <CodeView lines={LINES} />

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          実際の画面
        </Typography>
        <Stack spacing={1} alignItems="flex-start">
          <p style={{ margin: 0 }}>
            count: {count} / {plain} / {memoized}
          </p>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Child probeKey="child" id={id} />
            <MemoChild probeKey="memo" id={id} />
            <MemoChild
              probeKey="memoInlineFn"
              id={id}
              onClick={() => setId(id + 1)}
            />
            <MemoChild probeKey="memoCallback" id={id} onClick={inc} />
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  )
}

const ReactRenderDemo = () => {
  const [board, setBoard] = useState<ProbeBoard>(createBoard)
  const [generation, setGeneration] = useState(0)
  const reset = () => {
    setBoard(createBoard())
    setGeneration((v) => v + 1)
  }

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        このコードがそのまま下で動いています。ボタンを押すと、その操作で
        <strong>実際に動いた行が黄色</strong>、動かなかった行は薄くなります。
        まず <code>setCount</code> を押して、<code>id</code>{' '}
        に関係する行のどれがスキップされるかを見てください。
      </Alert>
      <ProbeBoardContext.Provider value={board}>
        <App key={generation} onReset={reset} />
      </ProbeBoardContext.Provider>
    </Stack>
  )
}

export default ReactRenderDemo
