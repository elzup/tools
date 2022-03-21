import { faCheck, faLeaf } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  Box,
  Container,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material'
import { omit } from 'lodash'
import React, { useEffect, useMemo } from 'react'
import { RiPlantLine } from 'react-icons/ri'
import styled from 'styled-components'
import { useLocalStorage } from '../../utils/useLocalStorage'
import { Group, groups, picmins } from './picminConstants'

type MemoState = undefined | 'emp' | 'pre' | 'get'
const memoList: MemoState[] = ['emp', 'pre', 'get']
const nextState = (current: MemoState) => {
  return memoList[(memoList.indexOf(current || 'emp') + 1) % memoList.length]
}

function usePikminDb() {
  const [ver, setVer] = useLocalStorage<number>('pikmin-version', 0)
  const [memo, setMemo] = useLocalStorage<
    Record<string, Record<string, MemoState>>
  >('pikmin', {})

  useEffect(() => {
    if (ver === 0) {
      if (memo['k']) {
        const f = Object.assign({}, memo['f'] || {}, memo['k'])

        setMemo((v) => ({ ...omit(v, ['k']), f }))
      }
      setVer(1)
    }
  }, [])

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
function count<T>(a: T[], func: (v: T) => boolean): number {
  return a.reduce((p, v) => p + (func(v) ? 1 : 0), 0)
}
const leastCount = (cmemo: Record<string, MemoState>, group: Group) => {
  const total = group.only ? group.only.length : picmins.length
  const memos = Object.values(cmemo || {})
  const get = count(memos, (v) => v === 'get')
  const pre = count(memos, (v) => v === 'pre')
  const emp = total - get - pre

  return { least: total - get, get, emp, pre }
}

function PikblMemo() {
  const { memo, switchMemo, checkAll } = usePikminDb()
  const [desc, setDesc] = useLocalStorage<boolean>('pkbl-desk-mode', false)
  const [comp, setComp] = useLocalStorage<boolean>('pkbl-smart-mode', false)

  const { sortGroups } = useMemo(() => {
    const groupsWithCount = groups.map((v) => ({
      ...v,
      count: leastCount(memo[v.id], v),
    }))

    const sortGroups = sort(
      groupsWithCount,
      (v) => v.count.least - v.count.pre * 0.9
    )

    return { sortGroups }
  }, [memo])
  const tableViewGroups = comp ? sortGroups : groups

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
            label="ソート"
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
          {tableViewGroups.map((g) => (
            <tr key={g.id}>
              <th
                onClick={() => {
                  if (confirm(`"${g.name}"をすべてチェックしますか?`))
                    checkAll(g.id)
                }}
              >
                <div className="group-label">
                  <div data-has-sub={!!g.subIcon}>
                    <div className="main-icon">{<g.icon></g.icon>}</div>
                    {g.subIcon && (
                      <div className="sub-icon">{<g.subIcon></g.subIcon>}</div>
                    )}
                  </div>
                  <Typography variant="caption">{g.name}</Typography>
                </div>
              </th>
              {picmins.map((p) => (
                <td
                  data-memo={memo[g.id]?.[p.id] || 'emp'}
                  data-disabled={g.only && !g.only?.includes(p.id)}
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
      <Container>
        <Typography>リーチ</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {sortGroups.filter(({ count: { emp: v } }) => 1 <= v && v <= 2)
            .length === 0 && <div>なし</div>}
          {sortGroups
            .filter(({ count: { emp: v } }) => 1 <= v && v <= 2)
            .map((g) => (
              <Box
                p={1}
                key={g.id}
                sx={{ border: 'solid 1px', borderRadius: '4px' }}
              >
                <div className="label">
                  <Typography>{g.name}</Typography>
                  <g.icon></g.icon>
                </div>
                <Box key={g.id} sx={{ display: 'flex' }}>
                  {(g.only
                    ? picmins.filter((p) => g.only?.find((v) => v === p.id))
                    : picmins
                  )
                    .filter((p) => p !== undefined)
                    .filter(
                      (p) =>
                        memo[g.id]?.[p.id] === 'emp' ||
                        memo[g.id]?.[p.id] === undefined
                    )
                    .map((p) => (
                      <div
                        className="least"
                        key={p.id}
                        style={{ background: p.color }}
                      >
                        <RiPlantLine></RiPlantLine>
                        <p>{p.name}</p>
                      </div>
                    ))}
                </Box>
              </Box>
            ))}
        </Box>
      </Container>
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
    height: 3.5rem;
    text-align: center;
    font-size: 1.5rem;

    &[data-memo='pre'] {
      background-color: #fd0 !important;
    }
    &[data-memo='get'] {
      background-color: #af0 !important;
    }
    &[data-disabled='true'] {
      pointer-events: none;
      background-color: #888 !important;
    }
  }
  .group-label {
    display: grid;
    justify-content: center;
    align-items: center;
    height: 3rem;

    > * {
      text-align: center;
    }
    > div {
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 1.2rem;
      &[data-has-sub='true'] {
        .main-icon {
          position: relative;
          font-size: 0.9rem;
          top: -6px;
        }
        .sub-icon {
          position: relative;
          left: -10px;
        }
      }
    }
  }

  table[data-desc='false'] {
    td,
    th {
      height: 1.7rem;
      font-size: 1rem !important;
      line-height: 1rem;
    }
    .group-label {
      > *:last-child {
        display: none;
      }
      height: 1.4rem;
    }
    th {
      width: calc(100vw / 8);
    }
  }
  .label {
    display: flex;
  }
  .least {
    display: flex;
    text-align: center;
    border-radius: 4px;
    padding: 4px;
    margin: 4px;
    svg {
      margin-top: 4px;
    }
    p {
      padding: 0;
      margin: 0;
    }
  }
`

export default PikblMemo
