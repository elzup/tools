type Picmin = {
  id: string
  name: string
  color: string
}
type Group = {
  id: string
  name: string
}

export const picmins: Picmin[] = [
  { id: 're', name: '赤', color: '#ff0000' },
  { id: 'yw', name: '黄', color: '#ffff00' },
  { id: 'bu', name: '青', color: '#0000ff' },
  { id: 'pk', name: '紫', color: '#800080' },
  { id: 'wh', name: '白', color: '#ffffff' },
  { id: 'pi', name: '羽', color: '#ffc0cb' },
  { id: 'gr', name: '岩', color: '#808080' },
]

export const groups: Group[] = [
  { id: '2', name: 'レストラン' },
  { id: '0', name: '道ばた' },
]
