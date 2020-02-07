import * as React from 'react'
import { Input, Header } from 'semantic-ui-react'
import Layout from '../components/Layout'

export function convertUrlToBadge(url: string, action?: string) {
  const parts = url.split('/')
  const tail = parts.pop()

  const repoUrl = parts.join('/')
  const actionName = action || tail?.split('%3A').pop()

  const badgeUrl = `${repoUrl}/workflows/${action || actionName}/badge.svg`

  return {
    actionName,
    badgeUrl,
    badgeText: `![${actionName}](${badgeUrl})`,
  }
}

const title = 'GHA BadgeMaker'
const GHABadgePage = () => {
  const [url, setUrl] = React.useState<string>('')

  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>
      <p>Generate GitHub Actions Badge by url.</p>
      <Input
        value={url}
        placeholder="https://github.com~"
        onChange={({ target: { value } }) => setUrl(value)}
      />
      https://github.com/elzup/elzup.com/workflows/qawolf/badge.svg
    </Layout>
  )
}

export default GHABadgePage
