import dynamic from 'next/dynamic'
import Head from 'next/head'
import * as React from 'react'
import { createGlobalStyle } from 'styled-components'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const PikblMemo = dynamic(() => import('../components/PikblMemo'), {
  ssr: false,
})

const GlobalStyle = createGlobalStyle`
  body {  background: #86cb70;}
`
const title = 'デコピクミンMEMO'
const PikblMemoPage = () => {
  return (
    <Layout title={title} fullWidth>
      <GlobalStyle />
      <Head>
        <link rel="manifest" href="decopik.manifest.json" />
      </Head>
      <Title>
        <div style={{ margin: '0 8px 8px', fontSize: '2rem', color: 'white' }}>
          {title}
        </div>
      </Title>
      <PikblMemo />
    </Layout>
  )
}

export default PikblMemoPage
