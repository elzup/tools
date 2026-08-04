export type Rarity = 'N' | 'R' | 'SR' | 'SSR'

export type Block = {
  id: string
  name: string
  rarity: Rarity
  ranges: [number, number][]
}

export type Rgb = [number, number, number]
