import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Typography } from '@mui/material'
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

  console.log(memo)

  return (
    <Style>
      <table>
        <tbody>
          <tr>
            <th></th>
            {picmins.map((p) => (
              <th key={p.id}>{p.name}</th>
            ))}
          </tr>
          {groups.map((g) => (
            <tr key={g.id}>
              <th>
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
                  key={p.id}
                  onClick={() => switchMemo(g.id, p.id)}
                ></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Style>
  )
}

const Style = styled.div`
  table {
    width: 100%;
  }
  table,
  td,
  th {
    border-collapse: collapse;
    border: 1px solid #333;
  }
  th:first-child {
    width: 7rem;
  }

  td {
    height: 2rem;
    &[data-memo='emp'] {
    }
    &[data-memo='pre'] {
      background-color: #ffc;
    }
    &[data-memo='get'] {
      background-color: #af0;
    }
  }
  .group-label {
    display: grid;
    justify-content: center;
    > * {
      text-align: center;
    }
  }
`

export default PikblMemo
