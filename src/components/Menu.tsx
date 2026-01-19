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
  faCog,
  faCalculator,
  faChartLine,
  faClipboard,
  faClock,
  faCode,
  faComment,
  faDna,
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
        icon: faEye,
        label: '動体視力トレ',
        path: '/dynamic-va',
      },
      {
        icon: faDev,
        label: 'DevTools Camp',
        path: '/devtools-camp',
      },
      {
        icon: faMobileButton,
        label: 'Script buttons',
        path: '/script-buttons',
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
        icon: faImage,
        label: '4K Pattern SVG Generator',
        path: '/4kpx',
      },
      {
        icon: faGlobe,
        label: 'Global Public IP',
        path: '/global-ip',
      },
      {
        icon: faCode,
        label: 'Code Explorer',
        path: '/code-explorer',
      },
      {
        icon: faClipboard,
        label: 'Clipsh',
        path: '/clipsh',
      },
      {
        icon: faShapes,
        label: 'Time Clip',
        path: '/time-clip',
      },
      {
        icon: faExchangeAlt,
        label: 'テキスト変換',
        path: '/text-transformer',
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
        icon: faCalculator,
        label: 'Collatz graph',
        path: '/collatz-graph',
      },
      {
        icon: faCalculator,
        label: 'Frag simuration',
        path: '/frag-problab',
      },
      {
        icon: faChartLine,
        label: '分布推定ツール',
        path: '/norm-viewer',
      },
      {
        icon: faCalculator,
        label: 'Gray Code Visualizer',
        path: '/gray-code',
      },
      {
        icon: faChartLine,
        label: 'Lissajous Curves Grid',
        path: '/lissajous',
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
      {
        icon: faUserSecret,
        label: 'Random Generator',
        path: '/random',
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
    label: 'Graphical',
    routings: [
      {
        icon: faCog,
        label: 'Googol 歯車',
        path: '/googol',
      },
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
        icon: faDna,
        label: 'Bit Mixer',
        path: '/bit-mixer',
      },
      {
        icon: faImage,
        label: 'Speecher',
        path: '/speecher',
      },
      {
        icon: faComment,
        label: '語感スコア',
        path: '/gokan-score',
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
      {
        icon: faRing,
        label: 'マンデルブロ集合',
        path: '/mandelbulb',
      },
      {
        icon: faChartLine,
        label: 'Custom Pi Ratio Graph',
        path: '/custom-ratio-graph',
      },
    ],
  },
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
      {
        icon: faGraduationCap,
        label: 'Milion Learning Technology',
        path: '/million-learn-tech',
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
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }

  > div {
    > p {
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.5;
      margin-bottom: 0.75rem;
    }
  }

  .item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;

    svg {
      min-width: 1rem;
      width: 1rem;
      opacity: 0.7;
    }

    a {
      color: inherit;
      text-decoration: none;
      opacity: 0.85;
      transition: opacity 0.2s;
      font-size: 0.875rem;

      &:hover {
        opacity: 1;
      }
    }

    p {
      font-size: 0.875rem;
      opacity: 0.5;
    }
  }

  .secret-group {
    background: rgba(255, 100, 100, 0.1);
    border-radius: 8px;
    padding: 0.75rem;
  }
`

export default Menu
