import '@fortawesome/fontawesome-svg-core/styles.css'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@emotion/react'
import { GlobalStyle, theme } from '../components/theme'

const App = ({ Component, pageProps }: AppProps) => (
  <>
    <Head>
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, shrink-to-fit=no"
      />
      {/* <link rel="shortcut icon" href="/images/icon.png" /> */}
      {/* <link rel="manifest" href="/manifest.json" /> */}
    </Head>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyle />
      <Component {...pageProps} />
    </ThemeProvider>
  </>
)

export default App
