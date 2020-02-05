import * as React from 'react'
import { Input } from 'semantic-ui-react'
import Layout from '../components/Layout'

const GHABadgePage = () => {
  const [url, setUrl] = React.useState<string>('')

  return (
    <Layout title="GHA BadgeMaker">
      <h1>Introduction</h1>
      <h3>GHA BadgeMaker</h3>
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
