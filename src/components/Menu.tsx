import { faDev } from '@fortawesome/free-brands-svg-icons'
import {
  faEye,
  faIdBadge,
  faImage,
  faLightbulb,
  faStopCircle,
} from '@fortawesome/free-regular-svg-icons'
import {
  IconDefinition,
  faBowlingBall,
  faBug,
  faCalculator,
  faChartLine,
  faClipboard,
  faClock,
  faCode,
  faExchangeAlt,
  faFeatherAlt,
  faGlobe,
  faGraduationCap,
  faHome,
  faKeyboard,
  faLeaf,
  faListOl,
  faMobileButton,
  faPaintBrush,
  faPortrait,
  faPuzzlePiece,
  faRing,
  faShapes,
  faShieldAlt,
  faShieldVirus,
  faSkull,
  faSortNumericAsc,
  faSpider,
  faUserSecret,
  faWandSparkles,
  faWindowMinimize,
  faWindowRestore,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Typography } from '@mui/material'
import Link from 'next/link'
import { useState } from 'react'
import useKey from 'react-use/lib/useKey'
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
      {
        icon: faCode,
        label: 'Code Explorer',
        path: '/code-explorer',
      },
      {
        icon: faDev,
        label: 'DevTools Camp',
        path: '/devtools-camp',
      },
      {
        icon: faShapes,
        label: 'Time Clip',
        path: '/time-clip',
      },
      {
        icon: faMobileButton,
        label: 'Script buttons',
        path: '/script-buttons',
      },
      {
        icon: faExchangeAlt,
        label: 'テキスト変換',
        path: '/text-transformer',
      },
      {
        icon: faClock,
        label: 'Scope Timer',
        path: '/scope-timer',
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
      {
        icon: faGraduationCap,
        label: 'Milion Learning Technology',
        path: '/million-lean-tech',
      },
    ],
  },
  {
    label: 'Graphical',
    routings: [
      {
        icon: faPaintBrush,
        label: 'Creative Coding playground',
        path: '/creative-coding',
      },
      {
        icon: faCode,
        label: 'D3 Playground',
        path: '/d3-play',
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
        icon: faSpider,
        label: 'Diginima',
        path: '/diginima',
      },
      {
        icon: faSortNumericAsc,
        label: 'Decimal',
        path: '/decimal',
      },
      {
        icon: faWandSparkles,
        label: 'Magironic',
        path: '/magironic',
      },
      {
        icon: faImage,
        label: 'Speecher',
        path: '/speecher',
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

// デバッグ
const secretRoutings: RoutingGroup[] = [
  {
    label: 'Secret Tools',
    routings: [
      {
        icon: faSkull,
        label: 'Debug Console',
        path: '/debug',
      },
      {
        icon: faUserSecret,
        label: 'Random Generator',
        path: '/random',
      },
      {
        icon: faCalculator,
        label: 'Normal Distribution',
        path: '/normal-distribution',
      },
      {
        icon: faChartLine,
        label: 'Custom Ratio Graph',
        path: '/custom-ratio-graph',
      },
      {
        icon: faPaintBrush,
        label: 'P5 Playground',
        path: '/playground-p5',
      },
      {
        icon: faKeyboard,
        label: 'Kotobaru',
        path: '/kotobaru',
      },
      {
        icon: faClipboard,
        label: 'QR Form',
        path: '/qr-form',
      },
      {
        icon: faChartLine,
        label: 'Splatoon Cost',
        path: '/splatoonament-cost',
      },
      {
        icon: faChartLine,
        label: 'Cch',
        path: '/cryptowat-chart',
      },
    ],
  },
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
            <Typography>{routing.label}</Typography>
          </Link>
        </>
      )}
    </div>
  )
}

type Props = {
  currentPath: string
}

const Menu = ({ currentPath }: Props) => {
  const [showSecret, setShowSecret] = useState(false)

  // show secret while Alt is pressed
  const toggleSecret = () => setShowSecret((prev) => !prev)
  useKey('Alt', toggleSecret)

  const allRoutings = showSecret ? [...routings, ...secretRoutings] : routings

  return (
    <nav>
      <Style>
        {allRoutings.map((group) => (
          <div
            key={group.label}
            className={
              showSecret && group.label === 'Secret Tools' ? 'secret-group' : ''
            }
          >
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
}

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
