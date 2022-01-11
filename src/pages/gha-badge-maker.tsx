import { Card, TextField, Typography } from '@mui/material'
import * as React from 'react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

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
      <Title>{title}</Title>
      <p>Generate GitHub Actions Badge by url.</p>
      <div>
        <label>
          Badge Page URL <a href={exampleUrl}>example</a>
        </label>
        <TextField
          value={url}
          style={{ width: '100%' }}
          placeholder={exampleUrl}
          onChange={({ target: { value } }) => setUrl(value)}
        />
      </div>

      {result && (
        <Card>
          <Typography>
            {`Badge Generated Action "${result.actionName}"`}
          </Typography>
          <TextField fullWidth value={result.badgeText} />
          <p>
            <img src={result.badgeUrl}></img>
          </p>
        </Card>
      )}
    </Layout>
  )
}

export default GHABadgePage
