export type SourceCodeFeatures = {
  lineCount: number // 行数
  keywordCount: number // 特定のキーワードの数
  totalLength: number // ソースコード全体の長さ
  keywords: string[] // 検出されたキーワード一覧
}

// 特徴を抽出する関数
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
