import dynamic from 'next/dynamic'
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
      <Title>{title}</Title>
      <PikblMemo />
    </Layout>
  )
}

export default PikblMemoPage
