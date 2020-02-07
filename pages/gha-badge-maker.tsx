import * as React from 'react'
import { Input, Header, Message, Form, TextArea } from 'semantic-ui-react'
import Layout from '../components/Layout'

type ParseResult = {
  actionName: string
  badgeUrl: string
  badgeText: string
} | null

export function convertUrlToBadge(url: string, action?: string): ParseResult {
  if (url === '') return null

  const parts = url.split('/')
  const tail = parts.pop()

  const repoUrl = parts.join('/')
  const actionName = action || tail?.split('%3A').pop() || ''

  const badgeUrl = `${repoUrl}/workflows/${actionName}/badge.svg`

  return {
    actionName,
    badgeUrl,
    badgeText: `![${actionName}](${badgeUrl})`,
  }
}
const exampleUrl =
  'https://github.com/elzup/tools/actions?query=workflow%3Aqawolf'

const title = 'GHA BadgeMaker'
const GHABadgePage = () => {
  const [url, setUrl] = React.useState<string>('')
  const [result, setResult] = React.useState<ParseResult>(null)

  React.useEffect(() => {
    try {
      const res = convertUrlToBadge(url)

      setResult(res)
    } catch {
      setResult(null)
    }
  }, [url])

  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>
      <p>Generate GitHub Actions Badge by url.</p>
      <Form.Field>
        <label>
          Badge Page URL <a href={exampleUrl}>example</a>
        </label>
        <Input
          value={url}
          style={{ width: '100%' }}
          size="large"
          placeholder={exampleUrl}
          onChange={({ target: { value } }) => setUrl(value)}
        />
      </Form.Field>

      {result && (
        <Message>
          <Message.Header>
            {`Badge Generated Action "${result.actionName}"`}
          </Message.Header>
          <p>
            <Form>
              <TextArea value={result.badgeText} />
            </Form>
            <img src={result.badgeUrl}></img>
          </p>
        </Message>
      )}
    </Layout>
  )
}

export default GHABadgePage
