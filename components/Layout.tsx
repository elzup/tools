import * as React from 'react'
import Link from 'next/link'
import Head from 'next/head'

type Props = {
  title?: string
}

type Routing = {
  label: string
  path: string
}

const routings: Routing[] = [
  { label: 'Top', path: '/' },
  { label: 'GHA BadgeMaker', path: '/gh-action-badge-maker' },
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
    <header>
      <nav>
        {routings.map(routing => (
          <div key={routing.path}>
            <Link href={routing.path}>
              <a>{routing.label}</a>
            </Link>
          </div>
        ))}
      </nav>
    </header>
    {children}
    <footer>
      <hr />
      <a href="https://anozon.me">anozon.me</a>
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
