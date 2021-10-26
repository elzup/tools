import Link from 'next/link'
import * as React from 'react'
import { Container, List } from 'semantic-ui-react'

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
  {
    icon: 'pencil alternate',
    label: 'Text transformer',
    path: '/textmaster',
  },
  {
    icon: 'puzzle piece',
    label: 'word search',
    path: '/word-search',
  },
  {
    icon: 'bowling ball',
    label: '楕円ビリヤード',
    path: '/ellip-billiards',
  },
  {
    icon: 'creature',
    label: 'Diginima',
    path: '/diginima',
  },

  {
    icon: 'keyboard',
    label: 'KeyEvent Demo',
    path: '/key-event-master',
  },

  // {
  //   icon: 'calculator',
  //   label: '正規分布ツール',
  //   path: '/normal-distribution',
  // },
]

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

type Props = {
  currentPath: string
}
const Footer = ({ currentPath }: Props) => (
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
)

export default Footer
