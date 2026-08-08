import { faDev } from '@fortawesome/free-brands-svg-icons'
import {
  faEye,
  faIdBadge,
  faImage,
  faLightbulb,
  faStopCircle,
} from '@fortawesome/free-regular-svg-icons'
import {
  type IconDefinition,
  faBowlingBall,
  faBoxes,
  faCalendarDay,
  faCog,
  faCalculator,
  faCarSide,
  faChartLine,
  faCircleNotch,
  faDiagramProject,
  faClipboard,
  faClock,
  faCode,
  faComment,
  faDna,
  faArrowsLeftRight,
  faExchangeAlt,
  faFan,
  faFeatherAlt,
  faFont,
  faGlobe,
  faGraduationCap,
  faHome,
  faHourglassHalf,
  faKeyboard,
  faLeaf,
  faListOl,
  faMobileButton,
  faPaintBrush,
  faPalette,
  faPortrait,
  faPuzzlePiece,
  faRing,
  faShapes,
  faShieldAlt,
  faShieldVirus,
  faSkull,
  faSortNumericAsc,
  faSpider,
  faStroopwafel,
  faWandSparkles,
  faWindowMinimize,
  faWindowRestore,
} from '@fortawesome/free-solid-svg-icons'

export type Routing = {
  icon: IconDefinition
  label: string
  path: string
}

export type RoutingGroup = {
  label: string
  routings: Routing[]
}

export const routings: RoutingGroup[] = [
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
        icon: faPuzzlePiece,
        label: '虫食い検索',
        path: '/mushikui-search',
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
      {
        icon: faHourglassHalf,
        label: '進行タイマー',
        path: '/progress-timer',
      },
      {
        icon: faShapes,
        label: 'SpanBox',
        path: '/spanbox',
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
        icon: faLeaf,
        label: '割れ占い',
        path: '/cashew-fortune',
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
        icon: faDiagramProject,
        label: 'Venn, Upset viewer',
        path: '/upset-viewer',
      },
      {
        icon: faCalendarDay,
        label: '曜日計算 Explainer',
        path: '/weekday-calc',
      },
      {
        icon: faCalculator,
        label: 'Float有効桁数デモ',
        path: '/float-precision',
      },
      {
        icon: faRing,
        label: '3本の釘と糸の輪',
        path: '/nail-loop-curve',
      },
    ],
  },
  {
    label: 'Physics',
    routings: [
      {
        icon: faStopCircle,
        label: 'ストロボ効果',
        path: '/strobe',
      },
      {
        icon: faCarSide,
        label: 'シートベルト慣性ロック',
        path: '/seatbelt',
      },
      {
        icon: faStroopwafel,
        label: '無限チョコパズル',
        path: '/infinite-chocolate',
      },
      {
        icon: faBowlingBall,
        label: '楕円ビリヤード',
        path: '/ellip-billiards',
      },
      {
        icon: faBoxes,
        label: 'ドミノ倒し',
        path: '/domino-3d',
      },
      {
        icon: faCircleNotch,
        label: 'ボウル円運動',
        path: '/tusi-bowl',
      },
      {
        icon: faPuzzlePiece,
        label: '3D サイコロ',
        path: '/dice-3d',
      },
      {
        icon: faArrowsLeftRight,
        label: '倒立二重振り子カート',
        path: '/inverted-double-pendulum',
      },
      {
        icon: faFan,
        label: '砂ならしプロペラ',
        path: '/sand-leveler',
      },
      {
        icon: faChartLine,
        label: 'Lissajous Curves Grid',
        path: '/lissajous',
      },
      {
        icon: faCog,
        label: 'Googol 歯車',
        path: '/googol',
      },
    ],
  },

  {
    label: 'ComputerScience',
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
        icon: faDna,
        label: 'Bit Mixer',
        path: '/bit-mixer',
      },
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
        icon: faClock,
        label: 'アナログ時計で作る数字',
        path: '/clock-digits',
      },
    ],
  },
  {
    label: 'Graphical',
    routings: [
      {
        icon: faFont,
        label: 'Unicode ヒルベルトマップ',
        path: '/unicode-map',
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
      {
        icon: faPalette,
        label: 'RGB 全組み合わせ',
        path: '/rgb-combo',
      },
      {
        icon: faImage,
        label: 'Filter Lens',
        path: '/filter-lens',
      },
    ],
  },
  {
    label: 'Draft',
    routings: [
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
export const secretRoutings: RoutingGroup[] = [
  {
    label: 'Secret Tools',
    routings: [
      {
        icon: faCalculator,
        label: 'スタミナ計算機',
        path: '/stamina-calc',
      },
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

// 新規ページを追加したらここの先頭にも path を足す (Recent セクション用、カテゴリと重複表示可)
const recentPaths = [
  '/sand-leveler',
  '/inverted-double-pendulum',
  '/clock-digits',
  '/unicode-map',
  '/nail-loop-curve',
  '/tusi-bowl',
  '/cashew-fortune',
]

const flatRoutings = [...routings, ...secretRoutings].flatMap(
  (group) => group.routings
)

export const recentGroup: RoutingGroup = {
  label: 'Recent',
  routings: recentPaths
    .map((path) => flatRoutings.find((routing) => routing.path === path))
    .filter((routing): routing is Routing => routing !== undefined),
}
