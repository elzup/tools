import * as React from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { Container, List } from 'semantic-ui-react'

type Props = {
  title?: string
}

type Routing = {
  icon: string
  label: string
  path: string
}

const routings: Routing[] = [
  { icon: 'home', label: 'Top', path: '/' },
  {
    icon: 'translate',
    label: 'GHA BadgeMaker',
    path: '/gha-badge-maker',
  },
]

const Layout: React.FC<Props> = ({
  children,
  title = 'mini web tools by anozon',
}) => (
  <div>
    <Head>
      <title>{title}</title>
      <meta charSet="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    </Head>
    <header></header>
    <Container>{children}</Container>
    <footer>
      <Container>
        <hr />
        <nav>
          <List>
            {routings.map(routing => (
              <List.Item
                key={routing.path}
                icon={routing.icon}
                content={
                  <Link href={routing.path}>
                    <a>{routing.label}</a>
                  </Link>
                }
              />
            ))}
          </List>
        </nav>
        <a href="https://anozon.me">anozon.me</a>
      </Container>
    </footer>
    <style jsx>{`
      nav {
        display: flex;
        div:not(:first-child) {
          margin-left: 1rem;
        }
      }
    `}</style>
  </div>
)

export default Layout
