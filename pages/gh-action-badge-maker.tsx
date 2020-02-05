import * as React from 'react'
import Layout from '../components/Layout'

const GHABadgePage = () => {
  const [url, setUrl] = React.useState<string>('')

  return (
    <Layout title="GHA BadgeMaker">
      <h1>Introduction</h1>

      <h3>GHA BadgeMaker</h3>
      <p>Generate GitHub Actions Badge by url.</p>
      <input
        value={url}
        onChange={({ target: { value } }) => setUrl(value)}
      ></input>
    </Layout>
  )
}

export default GHABadgePage
