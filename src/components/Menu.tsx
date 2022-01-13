import {
  faIdBadge,
  faLightbulb,
  faStopCircle,
} from '@fortawesome/free-regular-svg-icons'
import {
  faBowlingBall,
  faCalculator,
  faChartLine,
  faGlobe,
  faHome,
  faKeyboard,
  faListOl,
  faPortrait,
  faPuzzlePiece,
  faRing,
  faShapes,
  faShieldAlt,
  faShieldVirus,
  faSpider,
  faTextWidth,
  faWindowMinimize,
  faWindowRestore,
  IconDefinition,
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
    label: 'Tool',
    routings: [
      { icon: faHome, label: 'Top', path: '/' },
      {
        icon: faListOl,
        label: '文字カウント',
        path: '/char-counter',
      },
      {
        icon: faCalculator,
        label: 'Collatz graph',
        path: '/collatz-graph',
      },
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
      {
        icon: faLightbulb,
        label: 'DivergenceMeter',
        path: '/divergence-meter',
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
    ],
  },

  {
    label: 'Security',
    routings: [
      {
        icon: faShieldAlt,
        label: 'noopener Attack Demo',
        path: '/noopener',
      },
      {
        icon: faShieldVirus,
        label: 'XSS Attack Demo',
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
        label: 'Sub window demo',
        path: '/sub-window-ex',
      },
      {
        icon: faKeyboard,
        label: 'KeyEvent Demo',
        path: '/key-event-master',
      },
      {
        icon: faShapes,
        label: 'SVG Playground',
        path: '/svg-play',
      },
      {
        icon: faSpider,
        label: 'Diginima',
        path: '/diginima',
      },
    ],
  },
  {
    label: 'ProtoType',
    routings: [
      {
        icon: faChartLine,
        label: 'Cryptowat chart three',
        path: '/cryptowat-chart',
      },
      {
        icon: faTextWidth,
        label: 'Text transformer',
        path: '/textmaster',
      },
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
    ],
  },
  {
    label: 'Closed',
    routings: [
      {
        icon: faPortrait,
        label: 'Mirror Camela',
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
  .item {
    display: flex;
    gap: 4px;
    svg {
      margin-top: 4px;
    }
  }
`

export default Menu