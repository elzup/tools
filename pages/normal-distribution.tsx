import * as React from 'react'
import { Input, Header, Message, Form, TextArea } from 'semantic-ui-react'
import Layout from '../components/Layout'

type ParseResult = {
  actionName: string
  badgeUrl: string
  badgeText: string
} | null

export function convertUrlToBadge(url: string, action?: string): ParseResult {
  const parseReg = '(https://github.com/.*/.*)/actions\\?query=workflow%3A(.*)'
  const m = new RegExp(parseReg).exec(url)

  if (!m) return null

  const [_, repoUrl, actionPath] = m
  const actionName = action || actionPath
  const badgeUrl = `${repoUrl}/workflows/${actionName}/badge.svg`

  return {
    actionName,
    badgeUrl,
    badgeText: `![${actionName}](${badgeUrl})`,
  }
}
const exampleUrl =
  'https://github.com/elzup/tools/actions?query=workflow%3Aqawolf'

const title = '正規分布ツール'
const NormalDistribution = () => {
  const [url, setUrl] = React.useState<string>('')

  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>
      <p></p>
      <Form.Field>
        <Input
          value={url}
          style={{ width: '100%' }}
          size="large"
          placeholder={exampleUrl}
          onChange={({ target: { value } }) => setUrl(value)}
        />
      </Form.Field>
    </Layout>
  )
}

export default NormalDistribution
