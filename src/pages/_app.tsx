import '@fortawesome/fontawesome-svg-core/styles.css'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { CssBaseline } from '@mui/material'
import { CacheProvider, EmotionCache, ThemeProvider } from '@emotion/react'
import { GlobalStyle, theme } from '../components/theme'
import createEmotionCache from '../utils/createEmotionCache'

const clientSideEmotionCache = createEmotionCache()

const App = ({
  Component,
  pageProps,
  emotionCache = clientSideEmotionCache,
}: AppProps & { emotionCache?: EmotionCache }) => (
  <CacheProvider value={emotionCache}>
    <Head>
      {/* <meta
              name="viewport"
              content="width=device-width, initial-scale=1, shrink-to-fit=no"
            /> */}
      <meta
        name="viewport"
        content="user-scalable=no, width=device-width, initial-scale=1.0, maximum-scale=1.0"
      />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap"
        rel="stylesheet"
      ></link>

      {/* <link rel="shortcut icon" href="/images/icon.png" /> */}
      {/* <link rel="manifest" href="/manifest.json" /> */}
    </Head>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyle />
      <Component {...pageProps} />
    </ThemeProvider>
  </CacheProvider>
)

export default App
