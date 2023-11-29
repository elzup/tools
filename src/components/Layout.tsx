import { Container } from '@mui/material'
import Head from 'next/head'
import { useRouter } from 'next/router'
import styled from 'styled-components'
import { ConfigProvider } from '../store'
import { WithChild } from '../types'
import Footer from './Footer'
import { Box } from './common/mui'

type Props = {
  title?: string
  fullWidth?: boolean
  top?: boolean
}

const Layout = ({
  children,
  currentPath,
  title = 'mini web tools by anozon',
  fullWidth = false,
  top = false,
}: WithChild<Props & { currentPath: string }>) => {
  const contentsBody = <>{children}</>

  return (
    <Wrap data-test={`page-${currentPath.replace(/\//g, '')}`}>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <Box sx={top ? {} : { minHeight: '100vh', height: 'max-content' }}>
        <ConfigProvider>
          {fullWidth ? contentsBody : <Container>{contentsBody}</Container>}
        </ConfigProvider>
      </Box>

      <Footer {...{ currentPath }} />
    </Wrap>
  )
}

const Wrap = styled.div`
  padding: 2rem 0;
  height: 100vh;
  margin: 0;
  display: grid;
  grid-template-rows: 1fr auto;

  .wrapper {
    min-height: 100%;
    margin-bottom: -50px;
  }
  footer {
    grid-row-start: 2;
    grid-row-end: 3;
  }
`

function LayoutRouter(props: WithChild<Props>) {
  const { pathname } = useRouter()

  return <Layout {...props} currentPath={pathname} />
}

export default LayoutRouter
