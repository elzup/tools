import {
  Button,
  ButtonGroup,
  Paper,
  Typography,
  alpha,
  styled,
} from '@mui/material'
import { useState } from 'react'
import { type MsgKind, type Scenario, resolve, stateAt } from './scenario'

// 見た目用の prop が DOM 属性に漏れて React が警告するのを防ぐ
const noFwd = (...names: string[]) => ({
  shouldForwardProp: (p: PropertyKey) => !names.includes(String(p)),
})

/* ---------- sequence diagram ----------
 * actor 1 人 = grid 2 列。actor i のライフライン中心は grid line 2i。
 * message は grid-column: 2i / 2j で中心間に張る */

const Grid = styled(
  'div',
  noFwd('n')
)<{ n: number }>(({ theme, n }) => ({
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: `repeat(${n * 2}, minmax(0, 1fr))`,
  rowGap: 2,
  minWidth: n * 150,
  '.life': {
    position: 'absolute',
    top: 30,
    bottom: 0,
    width: 0,
    borderLeft: `1px dashed ${theme.palette.divider}`,
  },
}))

const Actor = styled('div')(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  margin: '0 6px 8px',
  padding: '4px',
  textAlign: 'center',
  fontSize: 12,
  fontWeight: 700,
  color: theme.palette.primary.main,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 6,
  background: theme.palette.background.paper,
}))

const Phase = styled('div')(({ theme }) => ({
  gridColumn: '1 / -1',
  position: 'relative',
  zIndex: 1,
  margin: '8px 0 2px',
  padding: '2px 8px',
  fontSize: 11,
  letterSpacing: '.08em',
  color: theme.palette.text.secondary,
  background: alpha(theme.palette.text.primary, 0.06),
  borderRadius: 4,
}))

type CellState = 'current' | 'done' | 'todo'

const cellBase = ({ state }: { state: CellState }) => ({
  position: 'relative' as const,
  zIndex: 1,
  cursor: 'pointer',
  borderRadius: 5,
  fontSize: 12,
  lineHeight: 1.45,
  opacity: state === 'current' ? 1 : state === 'done' ? 0.75 : 0.4,
  transition: 'opacity .15s, background .15s',
})

const Msg = styled(
  'div',
  noFwd('state', 'kind', 'isLeft')
)<{ state: CellState; kind: MsgKind; isLeft: boolean }>(
  ({ theme, state, kind, isLeft }) => {
    const color = {
      normal: theme.palette.primary.main,
      local: theme.palette.primary.main,
      secret: theme.palette.warning.main,
      ok: theme.palette.success.main,
    }[kind]
    const head = isLeft
      ? { left: 0, borderRight: `8px solid ${color}` }
      : { right: 0, borderLeft: `8px solid ${color}` }
    return {
      ...cellBase({ state }),
      padding: '4px 12px 11px',
      textAlign: 'center',
      color,
      background: state === 'current' ? alpha(color, 0.12) : 'transparent',
      outline: state === 'current' ? `1px solid ${color}` : 'none',
      '> span': {
        color: theme.palette.text.primary,
        background: theme.palette.background.paper,
        padding: '0 4px',
        borderRadius: 3,
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 4,
        borderTop: `1.5px ${kind === 'local' ? 'dotted' : 'solid'} ${color}`,
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        bottom: -0.5,
        border: '5px solid transparent',
        borderLeftWidth: isLeft ? 0 : 8,
        borderRightWidth: isLeft ? 8 : 0,
        ...head,
      },
    }
  }
)

const Note = styled(
  'div',
  noFwd('state')
)<{ state: CellState }>(({ theme, state }) => ({
  ...cellBase({ state }),
  margin: '3px 4px',
  padding: '5px 8px',
  textAlign: 'center',
  border: `1px dashed ${state === 'current' ? theme.palette.primary.main : theme.palette.divider}`,
  background:
    state === 'current'
      ? alpha(theme.palette.primary.main, 0.12)
      : theme.palette.background.paper,
}))

const No = styled('b')(({ theme }) => ({
  fontSize: 10,
  color: theme.palette.text.secondary,
  marginRight: 4,
}))

/* ---------- vaults ---------- */

const VaultGrid = styled('div')({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 10,
})

const VaultBox = styled(
  Paper,
  noFwd('isWire')
)<{ isWire?: boolean }>(({ isWire }) => ({
  padding: '10px 12px',
  minWidth: 0,
  borderStyle: isWire ? 'dashed' : 'solid',
}))

const VaultItem = styled(
  'div',
  noFwd('secret', 'isNew', 'isGone')
)<{ secret?: boolean; isNew: boolean; isGone: boolean }>(
  ({ theme, secret, isNew, isGone }) => ({
    padding: '5px 7px',
    marginBottom: 5,
    borderRadius: 5,
    border: `1px solid ${secret ? theme.palette.warning.main : theme.palette.divider}`,
    background: secret ? alpha(theme.palette.warning.main, 0.1) : 'transparent',
    outline: isNew ? `2px solid ${theme.palette.primary.main}` : 'none',
    outlineOffset: 1,
    opacity: isGone ? 0.45 : 1,
    textDecoration: isGone ? 'line-through' : 'none',
    '.k': { fontSize: 12, fontWeight: 700 },
    '.tag': { fontSize: 10, marginLeft: 6, color: theme.palette.warning.main },
    '.v': {
      fontFamily: 'monospace',
      fontSize: 11,
      color: theme.palette.text.secondary,
      overflowWrap: 'anywhere',
    },
  })
)

type Props<C> = { scenario: Scenario<C>; ctx: C }

export const SequenceView = <C,>({ scenario: sc, ctx }: Props<C>) => {
  const [idx, setIdx] = useState(0)
  const last = sc.steps.length - 1
  const step = sc.steps[idx]
  const state = stateAt(sc, idx, ctx)
  const n = sc.actors.length
  const cellState = (i: number): CellState =>
    i === idx ? 'current' : i < idx ? 'done' : 'todo'

  return (
    <div>
      <Paper variant="outlined" sx={{ p: 2, overflowX: 'auto' }}>
        <Grid n={n}>
          {sc.actors.map((_, i) => (
            <div
              key={`life-${i}`}
              className="life"
              style={{ left: `${((i * 2 + 1) / (n * 2)) * 100}%` }}
            />
          ))}
          {sc.actors.map((a, i) => (
            <Actor
              key={a}
              style={{ gridColumn: `${i * 2 + 1} / ${i * 2 + 3}` }}
            >
              {a}
            </Actor>
          ))}
          {sc.steps.flatMap((st, i) => {
            const label = (
              <span key="label">
                <No>{i + 1}</No>
                {resolve(st.label, ctx)}
              </span>
            )
            const phase = st.phase
              ? [<Phase key={`ph-${i}`}>{st.phase}</Phase>]
              : []
            if (st.note !== undefined) {
              return [
                ...phase,
                <Note
                  key={i}
                  state={cellState(i)}
                  onClick={() => setIdx(i)}
                  style={{
                    gridColumn: `${st.note * 2 - 1} / ${st.note * 2 + 1}`,
                  }}
                >
                  {label}
                </Note>,
              ]
            }
            const [from, to] = st.msg ?? [1, 1]
            const isLeft = to < from
            const [lo, hi] = isLeft ? [to, from] : [from, to]
            return [
              ...phase,
              <Msg
                key={i}
                state={cellState(i)}
                kind={st.kind ? resolve(st.kind, ctx) : 'normal'}
                isLeft={isLeft}
                onClick={() => setIdx(i)}
                style={{ gridColumn: `${lo * 2} / ${hi * 2}` }}
              >
                {label}
              </Msg>,
            ]
          })}
        </Grid>
      </Paper>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          margin: '12px 0',
        }}
      >
        <ButtonGroup size="small">
          <Button disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
            ◀ 前
          </Button>
          <Button disabled={idx === last} onClick={() => setIdx(idx + 1)}>
            次 ▶
          </Button>
        </ButtonGroup>
        <Typography fontWeight={700}>
          STEP {idx + 1} / {sc.steps.length}　{step.title}
        </Typography>
      </div>
      <Paper variant="outlined" sx={{ p: 2, mb: 1.5 }}>
        <Typography variant="body2" component="div">
          {resolve(step.desc, ctx)}
        </Typography>
      </Paper>

      <VaultGrid>
        {sc.vaults.map((v) => (
          <VaultBox key={v.key} variant="outlined" isWire={v.isWire}>
            <Typography
              variant="caption"
              fontWeight={700}
              color={v.isWire ? 'text.secondary' : 'primary'}
            >
              {v.title}
            </Typography>
            <div style={{ marginTop: 6 }}>
              {(state[v.key] ?? []).length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                  (何も持っていない)
                </Typography>
              ) : (
                (state[v.key] ?? []).map((it) => (
                  <VaultItem
                    key={it.k}
                    secret={it.secret}
                    isNew={it.isNew}
                    isGone={it.isGone}
                  >
                    <div className="k">
                      {it.k}
                      {it.secret && <span className="tag">秘密</span>}
                    </div>
                    {it.v && <div className="v">{it.v}</div>}
                  </VaultItem>
                ))
              )}
            </div>
          </VaultBox>
        ))}
      </VaultGrid>
    </div>
  )
}
