import createEmotionServer from '@emotion/server/create-instance'
import NextDocument, { Head, Html, Main, NextScript } from 'next/document'
import React from 'react'
import { ServerStyleSheet } from 'styled-components'
import { theme } from '../components/theme'
import createEmotionCache from '../utils/createEmotionCache'

class Document extends NextDocument {
  render() {
    return (
      <Html lang={'ja'}>
        <meta name="theme-color" content={theme.palette.primary.main} />
        <Head>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(this.props as any).emotionStyleTags}
          <link
            href="https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap"
            rel="stylesheet"
          ></link>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

Document.getInitialProps = async (ctx) => {
  const sheet = new ServerStyleSheet()
  const originalRenderPage = ctx.renderPage

  const cache = createEmotionCache()
  const { extractCriticalToChunks } = createEmotionServer(cache)

  try {
    ctx.renderPage = () =>
      originalRenderPage({
        enhanceApp: (App) => (props) =>
          sheet.collectStyles(<App {...props} />),
      })

    const initialProps = await NextDocument.getInitialProps(ctx)

    const emotionStyles = extractCriticalToChunks(initialProps.html)
    const emotionStyleTags = emotionStyles.styles.map((style) => (
      <style
        data-emotion={`${style.key} ${style.ids.join(' ')}`}
        key={style.key}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: style.css }}
      />
    ))

    return {
      ...initialProps,
      styles: [
        ...React.Children.toArray(initialProps.styles),
        sheet.getStyleElement(),
        ...emotionStyleTags,
      ],
      emotionStyleTags,
    }
  } finally {
    sheet.seal()
  }
}

export default Document
