import crypto from 'crypto'
import { SourceCodeFeatures } from './codeFeatures'

// MagicSymbol 型
export type MagicSymbol = {
  type: 'rune' | 'glyph' // シンボルの種類
  position: {
    x: number // X座標
    y: number // Y座標
  }
  rotation: number // 回転角度
  metadata?: string // ソースコードの特徴を表現
}

// MagicLayer 型
export type MagicLayer = {
  id: string // レイヤーの識別子
  geometry: {
    type: 'circle' // 今回は単純に円形を仮定
    radius: number // レイヤーの半径
  }
  symbols: MagicSymbol[] // レイヤー内のシンボル
  animations: {
    rotationSpeed: number // 回転速度
    direction: 'clockwise' | 'counterclockwise' // 回転方向
  }
}

// 特徴から MagicLayer を生成する関数
export function convertFeaturesToMagicLayer(
  features: SourceCodeFeatures
): MagicLayer {
  const radius = Math.sqrt(features.lineCount * features.totalLength) / 10

  const symbols: MagicSymbol[] = Array.from({ length: features.lineCount }).map(
    (_, index) => ({
      type: Math.random() > 0.5 ? 'rune' : 'glyph', // ランダムなタイプ
      position: {
        x: Math.cos((index / features.lineCount) * 2 * Math.PI) * radius,
        y: Math.sin((index / features.lineCount) * 2 * Math.PI) * radius,
      },
      rotation: (index / features.lineCount) * 360,
      metadata: `Line ${index + 1}: Symbol generated`,
    })
  )

  return {
    id: crypto.createHash('md5').update(JSON.stringify(features)).digest('hex'),
    geometry: {
      type: 'circle',
      radius,
    },
    symbols,
    animations: {
      rotationSpeed: features.keywordCount,
      direction:
        features.totalLength % 2 === 0 ? 'clockwise' : 'counterclockwise',
    },
  }
}

export function extractFeaturesFromText(text: string): SourceCodeFeatures {
  const lines = text.split('\n')
  const keywords =
    text.match(/\b(function|const|let|class|if|else|return)\b/g) || []

  return {
    lineCount: lines.length,
    keywordCount: keywords.length,
    totalLength: text.length,
    keywords,
  }
}
