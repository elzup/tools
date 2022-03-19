import { ComponentType } from 'react'
import {
  FaBreadSlice,
  FaBug,
  FaCampground,
  FaCapsules,
  FaCoffee,
  FaCut,
  FaEnvelope,
  FaFilm,
  FaHamburger,
  FaIceCream,
  FaLandmark,
  FaPaw,
  FaPlane,
  FaRoad,
  FaShoppingCart,
  FaSnowflake,
  FaStar,
  FaStore,
  FaTrain,
  FaTree,
  FaTshirt,
  FaUmbrellaBeach,
  FaUtensils,
  FaWater,
} from 'react-icons/fa'
import { GiAcorn, GiBananaBunch, GiClover, GiMushroom } from 'react-icons/gi'

type Pikmin = {
  id: string
  name: string
  color: string
}
export type GroupBase = {
  id: string
  name: string
  short: string
  icon: ComponentType
  subIcon?: ComponentType
  only?: string[]
  sp?: true
}
export type Group = GroupBase & {
  sp: boolean
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

const groupsBases: GroupBase[] = [
  { id: 'a', name: 'レストラン', short: 'レ', icon: FaUtensils },
  { id: 'b', name: 'カフェ', short: 'カ', icon: FaCoffee },
  { id: 'c', name: 'デザート', short: 'デ', icon: FaIceCream },
  { id: 'd', name: '映画館', short: '映', icon: FaFilm },
  { id: 'e', name: '薬局', short: '薬', icon: FaCapsules },
  { id: 'f', name: '動物園', short: '動', icon: FaPaw },
  // { id: 'k', name: '動物園', short: '動', icon: FaPaw },
  { id: 'g2', name: '森-クワガタ', short: '森', icon: FaTree, subIcon: FaBug },
  {
    id: 'g1',
    name: '森-どんぐり',
    short: '森',
    icon: FaTree,
    subIcon: GiAcorn,
  },
  { id: 'h', name: '水辺', short: '水', icon: FaWater },
  { id: 'i', name: '郵便局', short: '郵', icon: FaEnvelope },
  { id: 'j', name: '美術館', short: '美', icon: FaLandmark },
  { id: 'l', name: '空港', short: '空', icon: FaPlane },
  { id: 'm', name: '駅', short: '駅', icon: FaTrain },
  { id: 'n', name: '砂浜', short: '砂', icon: FaUmbrellaBeach },
  { id: 'o', name: 'バーガー', short: 'バ', icon: FaHamburger },
  { id: 'p', name: 'コンビニ', short: 'コ', icon: FaStore },
  {
    id: 'q1',
    name: '店-キノコ',
    short: 'ス',
    icon: FaShoppingCart,
    subIcon: GiMushroom,
  },
  {
    id: 'q2',
    name: '店-バナナ',
    short: 'ス',
    icon: FaShoppingCart,
    subIcon: GiBananaBunch,
  },
  { id: 'v', name: 'ベーカリー', short: 'ベ', icon: FaBreadSlice },
  { id: 'w', name: '美容院', short: '美', icon: FaCut },
  { id: 'x', name: 'ファッション', short: 'ファ', icon: FaTshirt },
  { id: 'y', name: '公園', short: '公', icon: FaCampground },
  { id: 'y2', name: '四つ葉', short: '四', icon: GiClover },
  { id: 'z', name: 'みちばた', short: 'み', icon: FaRoad },
  {
    id: 'z1',
    name: 'みちばた-冬',
    short: '冬',
    icon: FaRoad,
    subIcon: FaSnowflake,
    sp: true,
  },
  {
    id: '_b',
    name: '旧正月',
    short: '正',
    icon: FaStar,
    sp: true,
    only: ['re', 'yw', 'bu'],
  },
]

// const isFaIconDef = (v: unknown): v is IconDefinition => {
//   return !!v['icon']
// }

export const groups: Group[] = groupsBases.map((g) => ({
  ...g,
  sp: g.sp || false,
  // icon: isFaIconDef(g.icon) ? <FontAwesomeIcon icon={g.icon} /> : FaStar,
}))
