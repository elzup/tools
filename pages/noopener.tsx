import * as React from 'react'
import { Input, Header, Form } from 'semantic-ui-react'
import Layout from '../components/Layout'

const title = 'noopener検証'
const NoOpener = () => {
  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>
      <p>
        <a href="/noopener-attacker" target="_blank">
          noopenerをつけていない危険なリンク
        </a>
      </p>
      <p>
        <a href="/noopener-attacker" target="_blank" rel="noopener">
          noopenerをつけているリンク
        </a>
      </p>
      <p>リンクを開いた状態でフォームに入力してください。</p>

      <Form.Field>
        <label></label>
        <Input style={{ width: '100%' }} type="password" size="large" />
      </Form.Field>
    </Layout>
  )
}

export default NoOpener
