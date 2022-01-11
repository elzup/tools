import punycode from 'punycode'
import React, { useState } from 'react'
import { Button, Form, Table, TextArea } from 'semantic-ui-react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

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
  return text
    .replace(/\t/g, '\\t')
    .replace(/\v/g, '\\v')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\f/g, '\\f')
    .replace(/\0/g, '\\0')
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
const NoOpenerAttacker = () => {
  const [text, setText] = useState<string>('Hello!!! 😎')
  const [counts, setCount] = useState<Count[]>([])

  return (
    <Layout title={title}>
      <Title>{title}</Title>

      <Form>
        <TextArea
          rows={8}
          onChange={(e, { value }) => setText(String(value || ''))}
        ></TextArea>
      </Form>
      <Button
        primary
        onClick={() => {
          setCount(analyzeCount(text))
        }}
      >
        カウントする
      </Button>
      <p>結果</p>
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>文字</Table.HeaderCell>
            <Table.HeaderCell>数</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {counts.map(({ char, count }) => (
            <Table.Row key={char}>
              <Table.Cell>{char}</Table.Cell>
              <Table.Cell>{count}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <p>詳細</p>
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>文字</Table.HeaderCell>
            <Table.HeaderCell>Raw</Table.HeaderCell>
            <Table.HeaderCell>Escape</Table.HeaderCell>
            <Table.HeaderCell>数</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {counts.map(({ char, count }) => (
            <Table.Row key={char}>
              <Table.Cell>{char}</Table.Cell>
              <Table.Cell>{visibleEscapes(char)}</Table.Cell>
              <Table.Cell>{escape(char)}</Table.Cell>
              <Table.Cell>{count}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Layout>
  )
}

export default NoOpenerAttacker
