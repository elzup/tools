import { Container } from '@mui/material'
import Head from 'next/head'
import { useRouter } from 'next/router'
import styled from 'styled-components'
import { ConfigProvider } from '../store'
import type { WithChild } from '../types'
import Footer, { type FooterMode } from './Footer'
import Header from './Header'

type Props = {
  title?: string
  fullWidth?: boolean
  top?: boolean
  footer?: FooterMode
  // 横padding を最小化する (スクショ等で横幅を最大に使いたいページ用)
  flush?: boolean
}

const Layout = ({
  children,
  currentPath,
  title = 'mini web tools by anozon',
  fullWidth = false,
  top = false,
  footer = 'full',
  flush = false,
}: WithChild<Props & { currentPath: string }>) => {
  const contentsBody = <>{children}</>

  return (
    <Wrap data-test={`page-${currentPath.replace(/\//g, '')}`}>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      <Header currentPath={currentPath} />

      <Main $flush={flush} style={top ? {} : { minHeight: '100vh' }}>
        <ConfigProvider>
          {fullWidth ? (
            contentsBody
          ) : (
            <Container maxWidth="lg" sx={{ px: { xs: 0, sm: 2, md: 3 } }}>
              {contentsBody}
            </Container>
          )}
        </ConfigProvider>
      </Main>

      <Footer currentPath={currentPath} mode={footer} />
    </Wrap>
  )
}

const Wrap = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`

// スマホでは横 padding を 2px まで削る。MUI Container の gutter と二重に
// かかって片側 32px (画面の 8%) を食っており、キャンバス系ページが見切れていた
const Main = styled.main<{ $flush?: boolean }>`
  flex: 1;
  padding: ${({ $flush }) => ($flush ? '1rem 2px' : '1.5rem 2px')};

  @media (min-width: 600px) {
    padding: ${({ $flush }) => ($flush ? '1.25rem 6px' : '2rem 12px')};
  }

  @media (min-width: 900px) {
    padding: ${({ $flush }) => ($flush ? '1.5rem 8px' : '2.5rem 24px')};
  }
`

function LayoutRouter(props: WithChild<Props>) {
  const { pathname } = useRouter()

  return <Layout {...props} currentPath={pathname} />
}

export default LayoutRouter
