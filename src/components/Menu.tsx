import {
  faIdBadge,
  faLightbulb,
  faStopCircle,
  faEye,
} from '@fortawesome/free-regular-svg-icons'
import {
  faBowlingBall,
  faCalculator,
  faChartLine,
  faClipboard,
  faExchangeAlt,
  faGlobe,
  faHome,
  faKeyboard,
  faLeaf,
  faListOl,
  faPortrait,
  faPuzzlePiece,
  faRing,
  faShapes,
  faShieldAlt,
  faShieldVirus,
  faSpider,
  faWindowMinimize,
  faWindowRestore,
  IconDefinition,
  faFeatherAlt,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Typography } from '@mui/material'
import Link from 'next/link'
import * as React from 'react'
import styled from 'styled-components'

type Routing = {
  icon: IconDefinition
  label: string
  path: string
}

type RoutingGroup = {
  label: string
  routings: Routing[]
}

const routings: RoutingGroup[] = [
  {
    label: 'Tool/Game',
    routings: [
      { icon: faHome, label: 'Top', path: '/' },
      {
        icon: faLeaf,
        label: 'ピクブルMEMO',
        path: '/pikbl-memo',
      },
      {
        icon: faListOl,
        label: '文字カウント',
        path: '/char-counter',
      },
      {
        icon: faKeyboard,
        label: '苦手タイピング',
        path: '/nigate-typing',
      },
      {
        icon: faClipboard,
        label: 'Clipsh',
        path: '/clipsh',
      },
      {
        icon: faEye,
        label: '動体視力トレ',
        path: '/dynamic-va',
      },
    ],
  },
  {
    label: 'DevTool',
    routings: [
      {
        icon: faStopCircle,
        label: '1px image data url',
        path: '/1px',
      },
      {
        icon: faGlobe,
        label: 'Global Public IP',
        path: '/global-ip',
      },
    ],
  },
  {
    label: 'Math',
    routings: [
      {
        icon: faCalculator,
        label: 'Pi Lab Monte Carlo',
        path: '/pi-lab',
      },
      {
        icon: faRing,
        label: 'マンデルブロ集合',
        path: '/mandelbulb',
      },
      {
        icon: faCalculator,
        label: 'Collatz graph',
        path: '/collatz-graph',
      },
      {
        icon: faCalculator,
        label: 'Frag simuration',
        path: '/frag-problab',
      },
    ],
  },

  {
    label: 'Security',
    routings: [
      {
        icon: faShieldAlt,
        label: 'noopener Demo',
        path: '/noopener',
      },
      {
        icon: faShieldVirus,
        label: 'XSS Demo',
        path: '/xss',
      },
      {
        icon: faWindowMinimize,
        label: 'Submit loop',
        path: '/hard-confirm',
      },
    ],
  },
  {
    label: 'Experiments',
    routings: [
      {
        icon: faWindowRestore,
        label: 'SubWindowDump',
        path: '/sub-window-ex',
      },
      {
        icon: faKeyboard,
        label: 'KeyEvent Demo',
        path: '/key-event-master',
      },
      {
        icon: faExchangeAlt,
        label: 'mermaid UI',
        path: '/mermaid-ui',
      },
    ],
  },
  {
    label: 'Art',
    routings: [
      {
        icon: faShapes,
        label: 'SVG Playground',
        path: '/svg-play',
      },
      {
        icon: faLightbulb,
        label: 'DivergenceMeter',
        path: '/divergence-meter',
      },
      {
        icon: faFeatherAlt,
        label: '進撃プロット',
        path: '/shingeki',
      },
    ],
  },
  {
    label: 'ProtoType',
    routings: [
      {
        icon: faPuzzlePiece,
        label: 'word search',
        path: '/word-search',
      },
      {
        icon: faBowlingBall,
        label: '楕円ビリヤード',
        path: '/ellip-billiards',
      },
      {
        icon: faChartLine,
        label: 'Cch',
        path: '/cryptowat-chart',
      },
      {
        icon: faSpider,
        label: 'Diginima',
        path: '/diginima',
      },
    ],
  },
  {
    label: 'Closed',
    routings: [
      {
        icon: faPortrait,
        label: 'Mirror Camera',
        path: '/mirror',
      },
      {
        icon: faIdBadge,
        label: 'GHA BadgeMaker',
        path: '/gha-badge-maker',
      },
    ],
  },
  // {
  //   icon: 'calculator',
  //   label: '正規分布ツール',
  //   path: '/normal-distribution',
  // },
]

function MenuItem({ routing, opened }: { routing: Routing; opened: boolean }) {
  return (
    <div className="item">
      <FontAwesomeIcon icon={routing.icon} />
      {opened ? (
        <Typography>{routing.label}</Typography>
      ) : (
        <>
          <Link href={routing.path}>
            <a>
              <Typography>{routing.label}</Typography>
            </a>
          </Link>
        </>
      )}
    </div>
  )
}

type Props = {
  currentPath: string
}
const Menu = ({ currentPath }: Props) => (
  <nav>
    <Style>
      {routings.map((group) => (
        <div key={group.label}>
          <Typography>{group.label}</Typography>
          {group.routings.map((routing) => (
            <MenuItem
              routing={routing}
              data-qa={routing.path}
              opened={routing.path === currentPath}
              key={routing.path}
            />
          ))}
        </div>
      ))}
    </Style>
  </nav>
)

const Style = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
  > div {
    margin-top: 16px;
  }
  .item {
    display: flex;
    gap: 4px;
    svg {
      margin-top: 4px;
      min-width: 1.4rem;
    }
  }
`

export default Menu
