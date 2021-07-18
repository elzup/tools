import * as React from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Container, List } from 'semantic-ui-react'

type Props = {
  title?: string
  fullWidth?: boolean
}

type Routing = {
  icon: string
  label: string
  path: string
}

const routings: Routing[] = [
  { icon: 'home', label: 'Top', path: '/' },
  {
    icon: 'chart bar outline',
    label: '文字列カウント Charactor frequency analysis',
    path: '/char-counter',
  },
  {
    icon: 'translate',
    label: 'GHA BadgeMaker',
    path: '/gha-badge-maker',
  },
  {
    icon: 'fire',
    label: 'noopener Attack Demo',
    path: '/noopener',
  },
  {
    icon: 'fire',
    label: 'XSS Attack Demo',
    path: '/xss',
  },
  {
    icon: 'calculator',
    label: 'Pi Lab Monte Carlo',
    path: '/pi-lab',
  },
  {
    icon: 'id badge outline',
    label: 'Mirror Camela',
    path: '/mirror',
  },
  {
    icon: 'calculator',
    label: 'Collatz graph',
    path: '/collatz-graph',
  },
  {
    icon: 'chart line',
    label: 'Cryptowat chart three',
    path: '/cryptowat-chart',
  },
  {
    icon: 'image outline',
    label: '1px image data url',
    path: '/1px',
  },
  {
    icon: 'chart bar outline',
    label: 'マンデルブロ集合 Mandelbrat',
    path: '/mandelbulb',
  },
  {
    icon: 'globe',
    label: 'Global Public IP',
    path: '/global-ip',
  },
  {
    icon: 'thermometer three quarters',
    label: 'Sub window demo',
    path: '/sub-window-ex',
  },
  // {
  //   icon: 'calculator',
  //   label: '正規分布ツール',
  //   path: '/normal-distribution',
  // },
]

const Layout: React.FC<Props & { currentPath: string }> = ({
  children,
  title = 'mini web tools by anozon',
  fullWidth,
  currentPath,
}) => (
  <div className="root" data-test={`page-${currentPath.replace(/\//g, '')}`}>
    <div>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <header></header>
      {fullWidth ? children : <Container>{children}</Container>}
    </div>
    <footer>
      <Container>
        <hr />
        <nav>
          <List>
            {routings.map((routing) => (
              <MenuItem
                routing={routing}
                data-qa={routing.path}
                opened={routing.path === currentPath}
                key={routing.path}
              />
            ))}
          </List>
        </nav>
        <a href="https://anozon.me">anozon.me</a>
      </Container>
    </footer>
    <style jsx>{`
      .root {
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
      }
    `}</style>
  </div>
)

function MenuItem({ routing, opened }: { routing: Routing; opened: boolean }) {
  return (
    <>
      <List.Item
        icon={routing.icon}
        data-opened={opened}
        content={
          opened ? (
            routing.label
          ) : (
            <Link href={routing.path}>
              <a>{routing.label}</a>
            </Link>
          )
        }
      />
      <style jsx>{`
        .item {
          border: blue solid;
          background: blue;
        }
      `}</style>
    </>
  )
}

function LayoutRouter(props: React.PropsWithChildren<Props>) {
  const { pathname } = useRouter()

  return <Layout {...props} currentPath={pathname} />
}

export default LayoutRouter
