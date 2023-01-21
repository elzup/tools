import { chunk } from '@elzup/kit/lib/chunk'
import Head from 'next/head'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const title = 'debug'

const CodeExplorerPage = () => {
  return (
    <Layout title={title}>
      <Head>
        <link rel="manifest" href="codeex.manifest.json" />

        {/* <meta property="og:image" content={imgUrl} /> */}
      </Head>
      <Title>
        <div>{title}</div>
      </Title>
      <div>{JSON.stringify(chunk(['1', '2', '3', '4', '5'], 3))}</div>
    </Layout>
  )
}

export default CodeExplorerPage
