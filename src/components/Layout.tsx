import { Container } from '@mui/material'
import Head from 'next/head'
import { useRouter } from 'next/router'
import styled from 'styled-components'
import { ConfigProvider } from '../store'
import { WithChild } from '../types'
import Footer, { FooterMode } from './Footer'
import Header from './Header'

type Props = {
  title?: string
  fullWidth?: boolean
  top?: boolean
  footer?: FooterMode
}

const Layout = ({
  children,
  currentPath,
  title = 'mini web tools by anozon',
  fullWidth = false,
  top = false,
  footer = 'full',
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

      <Main style={top ? {} : { minHeight: '100vh' }}>
        <ConfigProvider>
          {fullWidth ? contentsBody : <Container maxWidth="lg">{contentsBody}</Container>}
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

const Main = styled.main`
  flex: 1;
  padding: 2rem 1rem;

  @media (min-width: 600px) {
    padding: 2.5rem 1.5rem;
  }

  @media (min-width: 900px) {
    padding: 3rem 2rem;
  }
`

function LayoutRouter(props: WithChild<Props>) {
  const { pathname } = useRouter()

  return <Layout {...props} currentPath={pathname} />
}

export default LayoutRouter
