import { alpha, Box } from '@mui/material'
import { memo, useCallback } from 'react'
import {
  entryOf,
  paintCount,
  paintStatus,
  useProbeBoard,
  useRenderProbe,
} from './probeBoard'

type ChildProps = {
  probeKey: string
  id: number
  onClick?: () => void
}

// 表示しているコードの `const Child = ({ id, onClick }) => <button …>` に対応する実物
const ChildBody = ({ probeKey, id, onClick }: ChildProps) => {
  useRenderProbe(probeKey)
  return (
    <button type="button" onClick={onClick}>
      ID {id}
    </button>
  )
}

export const Child = (props: ChildProps) => <ChildBody {...props} />
export const MemoChild = memo(ChildBody)

export type CodeLine = {
  code: string
  probe?: { key: string; kind: string }
}

const BADGE_WIDTH = 132

const ProbeBadge = ({ probeKey, kind }: { probeKey: string; kind: string }) => {
  const board = useProbeBoard()

  const countRef = useCallback(
    (el: HTMLSpanElement | null) => {
      const entry = entryOf(board, probeKey)
      entry.countEl = el
      paintCount(entry)
    },
    [board, probeKey]
  )
  const statusRef = useCallback(
    (el: HTMLSpanElement | null) => {
      const entry = entryOf(board, probeKey)
      entry.statusEl = el
      paintStatus(board, entry)
    },
    [board, probeKey]
  )

  return (
    <Box
      component="span"
      sx={{ display: 'inline-flex', gap: 0.75, alignItems: 'center' }}
    >
      <span>{kind}</span>
      <Box
        component="span"
        ref={countRef}
        data-testid={`count-${probeKey}`}
        sx={{ fontWeight: 700 }}
      />
      <Box
        component="span"
        ref={statusRef}
        data-testid={`status-${probeKey}`}
        sx={{
          px: 0.5,
          borderRadius: 0.5,
          fontSize: '0.75em',
          bgcolor: 'action.selected',
          '&[data-state="ran"]': {
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
          },
        }}
      />
    </Box>
  )
}

const splitComment = (code: string) => {
  const index = code.indexOf('//')
  if (index < 0) return { body: code, comment: '' }
  return { body: code.slice(0, index), comment: code.slice(index) }
}

const Line = ({ line, no }: { line: CodeLine; no: number }) => {
  const { body, comment } = splitComment(line.code)
  return (
    <Box
      data-flash
      data-testid={line.probe ? `line-${line.probe.key}` : undefined}
      sx={{
        display: 'flex',
        minWidth: 'max-content',
        borderRadius: 0.5,
        '&:has([data-state="ran"])': {
          bgcolor: (t) => alpha(t.palette.warning.main, 0.18),
        },
        '&:has([data-state="skipped"]) .code': { opacity: 0.4 },
      }}
    >
      <Box
        component="span"
        sx={{ width: 28, color: 'text.disabled', textAlign: 'right', pr: 1 }}
      >
        {no}
      </Box>
      <Box
        component="span"
        sx={{ width: BADGE_WIDTH, flexShrink: 0, color: 'text.secondary' }}
      >
        {line.probe && (
          <ProbeBadge probeKey={line.probe.key} kind={line.probe.kind} />
        )}
      </Box>
      <Box component="span" className="code" sx={{ whiteSpace: 'pre' }}>
        {body}
        <Box component="span" sx={{ color: 'success.main' }}>
          {comment}
        </Box>
      </Box>
    </Box>
  )
}

export const CodeView = ({ lines }: { lines: CodeLine[] }) => (
  <Box
    component="pre"
    sx={{
      m: 0,
      p: 1.5,
      overflowX: 'auto',
      bgcolor: 'action.hover',
      borderRadius: 1,
      fontFamily: 'monospace',
      fontSize: { xs: '0.75rem', sm: '0.85rem' },
      lineHeight: 1.7,
    }}
  >
    {lines.map((line, i) => (
      <Line key={i} line={line} no={i + 1} />
    ))}
  </Box>
)
