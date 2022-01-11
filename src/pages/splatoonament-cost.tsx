import { TextField } from '@mui/material'
import React, { useMemo, useState } from 'react'
import styled from 'styled-components'
import Layout from '../components/Layout'
import { Title } from '../components/Title'
import { sum } from '../utils'

const placeholder = `
太郎 A
Alice C-
Bob
マスター X2333
`.trim()

type Player = {
  name: string
  rank: string
  xp?: number
  cost: number
}

const costLib: Record<string, number> = {
  '-': 1200,
  'C+': 1200,
  'B-': 1300,
  'B+': 1500,
  'A-': 1550,
  A: 1600,
  'A+': 1650,
  S: 1700,
  'S+0': 1800,
  'S+1': 1800,
  'S+2': 1800,
  'S+3': 1800,
  'S+4': 1900,
  'S+5': 1900,
  'S+6': 1900,
  'S+7': 2000,
  'S+8': 2000,
  'S+9': 2000,
}
const calcCost = (rank: string, xp?: number): number => {
  if (costLib[rank]) return costLib[rank]
  if (rank !== 'X') return 1200
  return Math.max(2100, Math.round(((xp || 1) - 1) / 50) * 50)
}

const notNull = <T,>(item: T | null | false): item is T =>
  item !== false && item !== null
const playersParse = (text: string) => {
  return text
    .split('\n')
    .map((line): Player | false => {
      const m = /(.*) ([ABC][+-]?|S[+][0-9]|S|X)?([0-9]+)?$/.exec(line.trim())

      if (!m) return false
      const [, name, rank = '-', xp = undefined] = m

      return {
        name,
        rank,
        xp: xp ? parseInt(xp) : undefined,
        cost: calcCost(rank, parseInt(xp || '0')),
      }
    })
    .filter(notNull)
}

const title = 'Splatoonament チェッカー'
const SplatoonamentCost = () => {
  const [text, setText] = useState<string>(placeholder)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const players = useMemo(() => playersParse(text), [text])
  const entries = players.filter((p) => checked[p.name])
  const cost = entries.map((ep) => ep.cost).reduce(sum, 0)

  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <pre>
        <code>
          {`～C+：1200
B-：1300
B：1400
B+：1500
A-：1550
A：1600
A+：1650
S：1700
S+0-3：1800
S+4-6：1900
S+7-9：2000
X(-2125)：2100
X(2126-2175)：2150
X(2176-2225)：2200
以下略 50区切りで近い値
`}
        </code>
      </pre>

      <div style={{ padding: '8px' }}>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            width: '100%',
          }}
        >
          <div style={{ maxWidth: '50%' }}>
            <TextField
              multiline
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div style={{ maxWidth: '50%' }}>
            <Table>
              <thead>
                <tr>
                  <th>参加</th>
                  <th>名前</th>
                  <th>ランク</th>
                  <th>XP</th>
                  <th>コスト</th>
                  <th>参加コスト</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr key={`${p.name}_${i}`}>
                    <td>
                      <input
                        type="checkbox"
                        checked={checked[p.name]}
                        onClick={() =>
                          setChecked({ ...checked, [p.name]: !checked[p.name] })
                        }
                      />
                    </td>
                    <td>{p.name}</td>
                    <td>{p.rank}</td>
                    <td>{p.xp || '-'}</td>
                    <td>{p.cost}</td>
                    <td>{checked[p.name] && p.cost}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <h5>合計</h5>
            <p>
              メンバ({entries.length}人):{' '}
              {entries.map((ep) => ep.name).join(',')} <br />
              コスト: {cost}
              <br />
              残りコスト(7400以内): {7400 - cost}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

const Table = styled.table`
  border-collapse: collapse;

  td,
  th {
    border: 1px solid #333;
    text-align: right;
    &:nth-child(1) {
      text-align: center;
    }
    &:nth-child(3) {
      text-align: center;
    }
  }
`

export default SplatoonamentCost
