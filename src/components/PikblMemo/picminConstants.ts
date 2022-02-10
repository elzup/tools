import { faStar, IconDefinition } from '@fortawesome/free-regular-svg-icons'
import {
  faAppleAlt,
  faBreadSlice,
  faBug,
  faCampground,
  faCapsules,
  faCoffee,
  faCut,
  faEnvelope,
  faFilm,
  faHamburger,
  faIceCream,
  faLandmark,
  faPaw,
  faPlane,
  faRoad,
  faShoppingCart,
  faSnowflake,
  faStore,
  faTrain,
  faTree,
  faTshirt,
  faUmbrellaBeach,
  faUtensils,
  faWater,
} from '@fortawesome/free-solid-svg-icons'

type Pikmin = {
  id: string
  name: string
  color: string
}
export type Group = {
  id: string
  name: string
  short: string
  icon: IconDefinition
  only?: string[]
}

export const picmins: Pikmin[] = [
  { id: 're', name: '赤', color: '#ff0000' },
  { id: 'yw', name: '黄', color: '#ffff00' },
  { id: 'bu', name: '青', color: '#0000ff' },
  { id: 'pk', name: '紫', color: '#800080' },
  { id: 'wh', name: '白', color: '#ffffff' },
  { id: 'pi', name: '羽', color: '#ffc0cb' },
  { id: 'gr', name: '岩', color: '#808080' },
]

export const groups: Group[] = [
  { id: 'a', name: 'レストラン', short: 'レ', icon: faUtensils },
  { id: 'b', name: 'カフェ', short: 'カ', icon: faCoffee },
  { id: 'c', name: 'デザート', short: 'デ', icon: faIceCream },
  { id: 'd', name: '映画館', short: '映', icon: faFilm },
  { id: 'e', name: '薬局', short: '薬', icon: faCapsules },
  { id: 'f', name: '動物園', short: '動', icon: faPaw },
  // { id: 'k', name: '動物園', short: '動', icon: faPaw },
  { id: 'g2', name: '森-クワガタ', short: '森', icon: faBug },
  { id: 'g1', name: '森-どんぐり', short: '森', icon: faTree },
  { id: 'h', name: '水辺', short: '水', icon: faWater },
  { id: 'i', name: '郵便局', short: '郵', icon: faEnvelope },
  { id: 'j', name: '美術館', short: '美', icon: faLandmark },
  { id: 'l', name: '空港', short: '空', icon: faPlane },
  { id: 'm', name: '駅', short: '駅', icon: faTrain },
  { id: 'n', name: '砂浜', short: '砂', icon: faUmbrellaBeach },
  { id: 'o', name: 'バーガー', short: 'バ', icon: faHamburger },
  { id: 'p', name: 'コンビニ', short: 'コ', icon: faStore },
  { id: 'q1', name: '店-キノコ', short: 'ス', icon: faShoppingCart },
  { id: 'q2', name: '店-バナナ', short: 'ス', icon: faAppleAlt },
  { id: 'v', name: 'ベーカリー', short: 'ベ', icon: faBreadSlice },
  { id: 'w', name: '美容院', short: '美', icon: faCut },
  { id: 'x', name: 'ファッション', short: 'ファ', icon: faTshirt },
  { id: 'y', name: '公園', short: '公', icon: faCampground },
  { id: 'z', name: 'みちばた', short: 'み', icon: faRoad },
  { id: 'z1', name: 'みちばた-冬', short: '冬', icon: faSnowflake },
  {
    id: '_b',
    name: '旧正月',
    short: '正',
    icon: faStar,
    only: ['re', 'yw', 'bu'],
  },
]
