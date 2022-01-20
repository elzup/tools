type Pikmin = {
  id: string
  name: string
  color: string
}
type Group = {
  id: string
  name: string
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
  { id: 'a', name: 'レストラン' },
  { id: 'b', name: 'カフェ' },
  { id: 'c', name: 'デザート' },
  { id: 'd', name: '映画館' },
  { id: 'e', name: '薬局' },
  { id: 'f', name: '動物園' },
  { id: 'g1', name: '森1' },
  { id: 'g2', name: '森2' },
  { id: 'h', name: '水辺' },
  { id: 'i', name: '郵便局' },
  { id: 'j', name: '美術館' },
  { id: 'k', name: '動物園' },
  { id: 'l', name: '空港' },
  { id: 'm', name: '駅' },
  { id: 'n', name: '砂浜' },
  { id: 'o', name: 'バーガー' },
  { id: 'p', name: 'コンビニ' },
  { id: 'q1', name: 'スーパー1' },
  { id: 'q2', name: 'スーパー2' },
  { id: 'v', name: 'ベーカリー' },
  { id: 'w', name: '美容院' },
  { id: 'x', name: 'ファッション' },
  { id: 'y', name: '公園' },
  { id: 'z', name: 'みちばた' },
]
