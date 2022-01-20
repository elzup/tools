import { faCheck, faLeaf } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, FormControlLabel, Switch, Typography } from '@mui/material'
import React, { useMemo } from 'react'
import styled from 'styled-components'
import { useLocalStorage } from '../../utils/useLocalStorage'
import { groups, picmins } from './picminConstants'

type MemoState = undefined | 'emp' | 'pre' | 'get'
const memoList: MemoState[] = ['emp', 'pre', 'get']
const nextState = (current: MemoState) => {
  return memoList[(memoList.indexOf(current || 'emp') + 1) % memoList.length]
}

function usePikminDb() {
  const [memo, setMemo] = useLocalStorage<
    Record<string, Record<string, MemoState>>
  >('pikmin', {})

  return {
    memo,
    switchMemo: (groupId: string, pikminId: string) => {
      setMemo((prev) => ({
        ...prev,
        [groupId]: {
          ...prev[groupId],
          [pikminId]: nextState(prev[groupId]?.[pikminId]),
        },
      }))
    },
    checkAll: (groupId: string) => {
      setMemo((prev) => ({
        ...prev,
        [groupId]: picmins.reduce((acc, p) => ({ ...acc, [p.id]: 'get' }), {}),
      }))
    },
  }
}
function sort<T>(a: T[], comp: (v: T) => number): T[] {
  return a
    .map((v) => [v, comp(v)] as const)
    .sort(([, a], [, b]) => a - b)
    .map(([v]) => v)
}

function PikblMemo() {
  const { memo, switchMemo, checkAll } = usePikminDb()
  const [desc, setDesc] = useLocalStorage<boolean>('pkbl-desk-mode', false)
  const [comp, setComp] = useLocalStorage<boolean>('pkbl-smart-mode', false)

  const sortGroups = useMemo(() => {
    if (!comp) return groups
    const isComp = (group: Record<string, MemoState>) => {
      const memos = Object.values(group || {})

      return memos.length === 7 && memos.every((v) => v === 'get')
    }

    return sort(groups, (v) => (isComp(memo[v.id]) ? 1 : 0))
  }, [memo, comp])

  return (
    <Style>
      <Box style={{ marginLeft: '8px' }}>
        <label>
          <FormControlLabel
            control={<Switch onClick={() => setDesc(!desc)}></Switch>}
            label="詳細表示"
            labelPlacement="end"
            checked={desc}
          />
        </label>
        <label>
          <FormControlLabel
            control={<Switch onClick={() => setComp(!comp)}></Switch>}
            label="コンプを整理"
            labelPlacement="end"
            checked={comp}
          />
        </label>
      </Box>
      <table data-desc={desc}>
        <tbody>
          <tr>
            <th></th>
            {picmins.map((p) => (
              <th
                key={p.id}
                data-pid={p.id}
                style={{ background: `${p.color}88` }}
              >
                {p.name}
              </th>
            ))}
          </tr>
          {sortGroups.map((g) => (
            <tr key={g.id}>
              <th
                onClick={() => {
                  if (confirm(`"${g.name}"をすべてチェックしますか?`))
                    checkAll(g.id)
                }}
              >
                <div className="group-label">
                  <div>
                    <FontAwesomeIcon icon={g.icon} />
                  </div>
                  <Typography variant="caption">{g.name}</Typography>
                </div>
              </th>
              {picmins.map((p) => (
                <td
                  data-memo={memo[g.id]?.[p.id] || 'emp'}
                  style={{ background: `${p.color}11` }}
                  key={p.id}
                  onClick={() => switchMemo(g.id, p.id)}
                >
                  {memo[g.id]?.[p.id] === 'pre' && (
                    <FontAwesomeIcon icon={faLeaf} />
                  )}
                  {memo[g.id]?.[p.id] === 'get' && (
                    <FontAwesomeIcon icon={faCheck} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Style>
  )
}

const Style = styled.div`
  background: white;
  table {
    width: 100%;
  }
  table,
  td,
  th {
    border-collapse: collapse;
    border: 1px solid #86cb70;
  }
  th:not(:first-child) {
    width: calc(calc(100vw - 5rem) / 7);
  }

  td {
    height: 2rem;
    text-align: center;
    font-size: 1.5rem;

    &[data-memo='pre'] {
      background-color: #fd0 !important;
    }
    &[data-memo='get'] {
      background-color: #af0 !important;
    }
  }
  .group-label {
    display: grid;
    justify-content: center;
    > * {
      text-align: center;
    }
  }

  table[data-desc='false'] {
    td,
    th {
      height: 1.2rem;
      font-size: 1rem !important;
    }
    .group-label {
      > *:last-child {
        display: none;
      }
    }
    th {
      width: calc(100vw / 8);
    }
  }
`

export default PikblMemo
