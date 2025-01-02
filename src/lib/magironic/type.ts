// 魔法陣全体の型
export type MagicCircle = {
  name: string // 魔法陣の名前
  description: string // 魔法陣の説明
  layers: MagicLayer[] // 魔法陣を構成するレイヤーの配列
}

// レイヤーの型
export type MagicLayer = {
  id: string // レイヤーの識別子
  geometry: LayerGeometry // レイヤーの形状
  symbols: MagicSymbol[] // レイヤー内のシンボル
  animations: LayerAnimation // レイヤーのアニメーション設定
}

// レイヤーの形状を表す型
export type LayerGeometry = {
  type: 'circle' | 'polygon' | 'complex' // 形状の種類
  radius: number // 半径
  sides?: number // 辺の数 (polygonの場合)
}

// レイヤー内のシンボルを表す型
export type MagicSymbol = {
  type: 'rune' | 'glyph' | 'icon' // シンボルの種類
  position: {
    x: number // X座標 (中心基準)
    y: number // Y座標 (中心基準)
  }
  rotation: number // シンボルの回転角度 (度数法)
}

// レイヤーのアニメーション設定を表す型
export type LayerAnimation = {
  rotationSpeed: number // 回転速度 (度/秒, 0で静止)
  direction: 'clockwise' | 'counterclockwise' // 回転方向
  scaling?: {
    min: number // 最小スケール
    max: number // 最大スケール
    speed: number // スケール変化の速度
  }
}
