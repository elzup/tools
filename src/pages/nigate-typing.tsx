import { Container } from '@mui/material'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import * as React from 'react'
import { createGlobalStyle } from 'styled-components'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const NigateTyping = dynamic(() => import('../components/NigateTyping'), {
  ssr: false,
})

const themeColor = '#fff'
const GlobalStyle = createGlobalStyle`
  body {
    background: ${themeColor} !important;
  }
  h1 {
    margin-left: 16px !important;
  }
  svg {
    min-width: 1.4rem;
  }
`

const title = '苦手タイパー nigate typing'
const description = 'タイピングで苦手な単語を登録しておけるツール'
const url = 'https://tools.anozon.me/nigate-typing'
// const imgUrl = `https://tools.anozon.me/pikbl-ss.png`
const NigateTyingPage = () => {
  return (
    <Layout title={title} fullWidth>
      <GlobalStyle />
      <Head>
        {/* <link rel="manifest" href="decopik.manifest.json" /> */}
        <meta name="application-name" content={title} />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={title} />
        <meta name="description" content={description} />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* <meta name="msapplication-config" content="/icons/browserconfig.xml" /> */}
        {/* <meta name="msapplication-TileColor" content="#2B5797" /> */}
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content={themeColor} />

        <link rel="apple-touch-icon" href="decopikmin-memo.png" />
        <link
          rel="apple-touch-icon"
          sizes="512x512"
          href="/decopikmin-memo-512.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="192x192"
          href="/decopikmin-memo-192.png"
        />
        {/* <link rel="shortcut icon" href="/favicon.ico" /> */}

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content={url} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {/* <meta name="twitter:image" content={imgUrl} /> */}
        <meta name="twitter:creator" content="@anozon" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:site_name" content={title} />
        <meta property="og:url" content={url} />
        {/* <meta property="og:image" content={imgUrl} /> */}
      </Head>
      <Container>
        <Title>
          <div style={{ margin: '0 8px 8px', fontSize: '2rem' }}>{title}</div>
        </Title>
      </Container>
      <NigateTyping />
    </Layout>
  )
}

export default NigateTyingPage
