import { Card, TextField } from '@mui/material'
import * as React from 'react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const title = 'noopener検証'
const NoOpener = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <p>
        <a
          href="/noopener-attacker"
          target="_blank"
          rel="opener" /* default at Chrome <= 87 */
        >
          <s>noopenerをつけていない危険なリンク</s> → openerをつけたリンク
        </a>
        {
          '(多くのブラウザで target="_blank"な場合は rel="noopener" がつくようになりました)'
        }
      </p>
      <p>
        <a href="/noopener-attacker" target="_blank" rel="noopener">
          noopenerをつけているリンク
        </a>
      </p>
      <p>リンクを開いた状態でフォームに入力してください。</p>

      <Card>
        <label></label>
        <TextField style={{ width: '100%' }} type="password" />
      </Card>
    </Layout>
  )
}

export default NoOpener
