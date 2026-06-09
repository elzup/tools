import punycode from 'punycode'
import { TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import styled from 'styled-components'
import Layout from '../components/Layout'
import { Title } from '../components/Title'
import { sum } from '../utils'
import { Box } from '../components/common/mui'

type Count = { char: string; count: number }

const punySplit = (s: string) =>
  punycode.ucs2.decode(s).map((v) => punycode.ucs2.encode([v]))

function analyzeCount(text: string): Count[] {
  const map: Record<string, number> = {}
  const chars = punySplit(text)

  chars.forEach((c) => {
    map[c] = (map[c] || 0) + 1
  })
  return Object.entries(map)
    .sort(([, v1], [, v2]) => v2 - v1)
    .map(([char, count]) => ({ char, count }))
}

function visibleEscapes(text: string) {
  return (
    text
      .replace(/\t/g, '\\t')
      .replace(/\v/g, '\\v')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\f/g, '\\f')
      // eslint-disable-next-line no-control-regex
      .replace(/\x00/g, '\\0')
  )
}
// ¥b	バックスペース
// ¥t	水平タブ
// ¥v	垂直タブ
// ¥n	改行
// ¥r	復帰
// ¥f	改ページ
// ¥’	シングルクオーテーション
// ¥”	ダブルクオーテーション
// ¥¥	¥文字
// ¥0	NULL文字
// ¥xXX	2桁のXX(16進数)が表すLatin-1文字
// ¥uXXXX	4桁のXXXX(16進数)が表すUnicode文字

const title = '文字頻度カウント(絵文字対応)'
const CharCounter = () => {
  const [text, setText] = useState<string>('Hello!!! 😎')
  const counts = useMemo(() => analyzeCount(text), [text])
  const total = counts.map((v) => v.count).reduce(sum, 0)

  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <Box mt={1}>
        <TextField
          multiline
          fullWidth
          defaultValue={text}
          rows={8}
          onChange={(e) => setText(String(e.target.value || ''))}
        />
      </Box>
      <Typography variant="h5">全体: {total}文字</Typography>
      <Style>
        <table>
          <thead>
            <tr>
              <th>文字</th>
              <th>数</th>
            </tr>
          </thead>

          <tbody>
            {counts.map(({ char, count }) => (
              <tr key={char}>
                <td>{char}</td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>詳細</p>
        <table>
          <thead>
            <tr>
              <th>文字</th>
              <th>Raw</th>
              <th>Escape</th>
              <th>数</th>
            </tr>
          </thead>

          <tbody>
            {counts.map(({ char, count }) => (
              <tr key={char}>
                <td>{char}</td>
                <td>{visibleEscapes(char)}</td>
                <td>{escape(char)}</td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Style>
    </Layout>
  )
}
const Style = styled.div`
  table {
    border-collapse: collapse;
    th,
    td {
      border-top: 1px solid #aaa;
      border-bottom: 1px solid #aaa;
      border-left: 1px solid #ccc;
      border-right: 1px solid #ccc;
      background: #ddd;
      padding: 0 0.5rem;
    }
    td {
      background: #fff;
    }
  }
`

export default CharCounter
