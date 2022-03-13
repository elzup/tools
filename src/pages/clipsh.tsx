import Head from 'next/head'
import * as React from 'react'
import { createGlobalStyle } from 'styled-components'
import ClipshContent from '../components/Clipsh'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const GlobalStyle = createGlobalStyle`
  --app-color: #99BD93;
  h1 {
    margin-left: 16px !important;
  }
`

const title = 'Clipsh'
const description = 'Clipboard text transform tool'
const url = 'https://tools.anozon.me/clipsh'
// const imgUrl = `https://tools.anozon.me/pikbl-ss.png`
const ClipshPage = () => {
  return (
    <Layout title={title} fullWidth>
      <GlobalStyle />
      <Head>
        <link rel="manifest" href="res-clipsh/manifest.json" />
        <meta name="application-name" content={title} />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={title} />
        <meta name="description" content={description} />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#99BD93" />

        <link rel="apple-touch-icon" href="/res-clipsh/clipsh.png" />
        <link
          rel="apple-touch-icon"
          sizes="512x512"
          href="/res-clipsh/clipsh-512.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="192x192"
          href="/res-clipsh/clipsh-192.png"
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
      <Title>{title}</Title>
      <ClipshContent />
    </Layout>
  )
}

export default ClipshPage
