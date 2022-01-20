import { faCheck, faLeaf } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, FormControlLabel, Switch, Typography } from '@mui/material'
import React from 'react'
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
  }
}

function PikblMemo() {
  const { memo, switchMemo } = usePikminDb()
  const [desc, setDesc] = useLocalStorage<boolean>('pkbl-desk-mode', false)

  console.log(memo)

  return (
    <Style>
      <Box style={{ marginLeft: '8px' }}>
        <label>
          <FormControlLabel
            value="end"
            control={
              <Switch
                onClick={() => {
                  setDesc(!desc)
                }}
              ></Switch>
            }
            label="詳細表示"
            labelPlacement="end"
            checked={desc}
          />
        </label>
      </Box>
      <table>
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
          {groups.map((g) => (
            <tr key={g.id}>
              <th>
                <div className="group-label" data-desc={desc}>
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
    width: calc(calc(100vw - 4.5rem) / 7);
  }

  td {
    height: 2rem;
    text-align: center;
    font-size: 1.5rem;

    }
    [data-memo='emp'] {
    }
    [data-memo='pre'] {
      background-color: #fd0 !important;
    }
    [data-memo='get'] {
      background-color: #af0 !important;
    }
  }
  .group-label {
    display: grid;
    justify-content: center;
    > * {
      text-align: center;
    }
    &[data-desc='false'] {
      font-size: 1.5rem;
      >*:last-child {
        display: none;
      }
    }
  }
`

export default PikblMemo
